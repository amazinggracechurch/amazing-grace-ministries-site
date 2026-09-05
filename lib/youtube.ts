import 'server-only'
import { env, has } from '@/lib/env'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import type { Sermon } from '@/lib/sermons'

/**
 * YouTube Data API v3 — server-side data layer for recent services.
 *
 * Fetches the channel's uploads playlist (derived from the channel ID:
 * UC… → UU…), then batch-fetches video details for durations. Results
 * are cached for one hour via `next: { revalidate: 3600 }`.
 *
 * Graceful degradation: every successful fetch is written through to
 * Firestore (`youtube_cache/latest`); when credentials are missing or
 * the API fails, the last-good Firestore snapshot is served instead.
 * Never throws; components render nothing when the result is empty.
 *
 * Types and display helpers live in lib/sermons.ts (client-safe).
 */

const API_BASE = 'https://www.googleapis.com/youtube/v3'
const REVALIDATE_SECONDS = 3600
const CACHE_DOC = 'youtube_cache/latest'

/** Persist the last good result so an API outage degrades gracefully. */
async function writeCache(sermons: Sermon[]): Promise<void> {
  if (!has.firebaseAdmin() || sermons.length === 0) return
  try {
    await adminDb()
      .doc(CACHE_DOC)
      .set({ sermons, updatedAt: FieldValue.serverTimestamp() })
  } catch {
    console.warn('[youtube] failed to write Firestore cache')
  }
}

/** The last good result, or empty when nothing has ever been cached. */
async function readCache(): Promise<Sermon[]> {
  if (!has.firebaseAdmin()) return []
  try {
    const doc = await adminDb().doc(CACHE_DOC).get()
    if (!doc.exists) return []
    const sermons = doc.get('sermons')
    return Array.isArray(sermons) ? (sermons as Sermon[]) : []
  } catch {
    return []
  }
}

type YouTubeThumbnail = { url: string; width?: number; height?: number }

type YouTubeSnippet = {
  title?: string
  publishedAt?: string
  thumbnails?: Partial<
    Record<'default' | 'medium' | 'high' | 'standard' | 'maxres', YouTubeThumbnail>
  >
}

type PlaylistItemsResponse = {
  items?: { snippet?: YouTubeSnippet & { resourceId?: { videoId?: string } } }[]
}

type VideosResponse = {
  items?: {
    id?: string
    snippet?: YouTubeSnippet
    contentDetails?: { duration?: string }
  }[]
}

/** Highest-resolution thumbnail available on the snippet. */
function bestThumbnail(thumbnails: YouTubeSnippet['thumbnails']): string {
  if (!thumbnails) return ''
  return (
    thumbnails.maxres?.url ??
    thumbnails.standard?.url ??
    thumbnails.high?.url ??
    thumbnails.medium?.url ??
    thumbnails.default?.url ??
    ''
  )
}

/** ISO 8601 duration (PT1H23M45S) → seconds. Null when absent/unparseable. */
function parseDuration(iso: string | undefined): number | null {
  if (!iso) return null
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso)
  if (!match) return null
  const [, hours, minutes, seconds] = match
  return Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0)
}

async function fetchJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const { YOUTUBE_API_KEY } = env.youtube()
  const url = new URL(`${API_BASE}/${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  url.searchParams.set('key', YOUTUBE_API_KEY)

  const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } })
  if (!response.ok) {
    // Never log the URL — it carries the API key.
    throw new Error(`[youtube] ${path} responded ${response.status}`)
  }
  return (await response.json()) as T
}

/** Batch-fetch video details (duration + snippet) for a set of video IDs. */
async function fetchVideos(ids: string[]): Promise<Sermon[]> {
  if (ids.length === 0) return []
  const data = await fetchJson<VideosResponse>('videos', {
    part: 'snippet,contentDetails,statistics',
    id: ids.join(','),
    maxResults: String(ids.length),
  })
  const sermons = new Map(
    (data.items ?? [])
      .filter((item): item is typeof item & { id: string } => Boolean(item.id))
      .map((item) => [
        item.id,
        {
          id: item.id,
          title: item.snippet?.title ?? 'Untitled service',
          publishedAt: item.snippet?.publishedAt ?? '',
          durationSeconds: parseDuration(item.contentDetails?.duration),
          thumbnail: bestThumbnail(item.snippet?.thumbnails),
          url: `https://www.youtube.com/watch?v=${item.id}`,
        },
      ])
  )
  // The API does not guarantee response order — keep the caller's order.
  return ids.map((id) => sermons.get(id)).filter((s): s is Sermon => Boolean(s))
}

/** Video IDs from the YOUTUBE_MANUAL_VIDEO_IDS env var (comma-separated). */
function envManualVideoIds(): string[] {
  return (process.env.YOUTUBE_MANUAL_VIDEO_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

const MANUAL_IDS_DOC = 'settings/youtube'
const MANUAL_IDS_TTL_MS = 5 * 60 * 1000

// Stale-while-revalidate module cache for the Firestore-managed list:
// reads within the TTL are free; the first read after expiry refetches.
let manualIdsCache: { ids: string[]; fetchedAt: number } | null = null

/** Drop the cached manual ID list (used by the admin refresh action). */
export function clearManualVideoIdsCache(): void {
  manualIdsCache = null
}

/**
 * Manual override IDs. The Firestore `settings/youtube` doc (managed from
 * /admin/sermons) wins when Firebase Admin is configured; the env var is
 * the fallback so the site works before the doc exists or when Firestore
 * is unreachable. Cached for 5 minutes per server instance.
 */
async function manualVideoIds(): Promise<string[]> {
  if (has.firebaseAdmin()) {
    const now = Date.now()
    if (manualIdsCache && now - manualIdsCache.fetchedAt < MANUAL_IDS_TTL_MS) {
      return manualIdsCache.ids
    }
    try {
      const doc = await adminDb().doc(MANUAL_IDS_DOC).get()
      const raw: unknown = doc.exists ? doc.get('manualVideoIds') : null
      const ids = Array.isArray(raw)
        ? raw
            .filter((id): id is string => typeof id === 'string')
            .map((id) => id.trim())
            .filter(Boolean)
        : []
      manualIdsCache = { ids, fetchedAt: now }
      if (ids.length > 0) return ids
    } catch {
      // Firestore hiccup — degrade to the env var below.
    }
  }
  return envManualVideoIds()
}

/**
 * The most recent services from the church's YouTube channel.
 * Manual IDs (the Firestore `settings/youtube` doc, falling back to the
 * YOUTUBE_MANUAL_VIDEO_IDS env var) take precedence over the uploads
 * playlist. Never throws — on any failure, serves the last-good
 * Firestore snapshot (empty until the first successful fetch).
 */
export async function getRecentSermons(count = 4): Promise<Sermon[]> {
  if (!has.youtube()) return readCache()

  try {
    const manual = await manualVideoIds()
    if (manual.length > 0) {
      const sermons = await fetchVideos(manual.slice(0, count))
      await writeCache(sermons)
      return sermons
    }

    const { YOUTUBE_CHANNEL_ID } = env.youtube()
    // Every channel's uploads playlist ID is its channel ID with UC → UU.
    const uploadsPlaylistId = `UU${YOUTUBE_CHANNEL_ID.slice(2)}`
    const playlist = await fetchJson<PlaylistItemsResponse>('playlistItems', {
      part: 'snippet',
      playlistId: uploadsPlaylistId,
      maxResults: String(count),
    })
    const ids = (playlist.items ?? [])
      .map((item) => item.snippet?.resourceId?.videoId)
      .filter((id): id is string => Boolean(id))
    const sermons = await fetchVideos(ids)
    await writeCache(sermons)
    return sermons
  } catch {
    return readCache()
  }
}
