import { env, has } from '@/lib/env'

/**
 * YouTube Data API v3 — server-side data layer for recent services.
 *
 * Fetches the channel's uploads playlist (derived from the channel ID:
 * UC… → UU…), then batch-fetches video details for durations. Results
 * are cached for one hour via `next: { revalidate: 3600 }`.
 *
 * Graceful degradation: missing credentials or any API failure returns
 * FALLBACK_SERMONS (never throws), and components render nothing when
 * the result is empty.
 */

export type Sermon = {
  id: string
  title: string
  publishedAt: string
  durationSeconds: number | null
  thumbnail: string
  url: string
}

/**
 * Last-good cache. Ships empty for now — components hide themselves
 * when this is all we have. Phase 2: becomes the Firestore
 * `youtube_cache/latest` document, refreshed on each successful fetch.
 */
export const FALLBACK_SERMONS: Sermon[] = []

const API_BASE = 'https://www.googleapis.com/youtube/v3'
const REVALIDATE_SECONDS = 3600

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

/** Video IDs set manually via YOUTUBE_MANUAL_VIDEO_IDS (comma-separated). */
function manualVideoIds(): string[] {
  return (process.env.YOUTUBE_MANUAL_VIDEO_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

/**
 * The most recent services from the church's YouTube channel.
 * Manual IDs (YOUTUBE_MANUAL_VIDEO_IDS) take precedence over the
 * uploads playlist. Never throws — returns FALLBACK_SERMONS when
 * YouTube is unconfigured or unreachable.
 */
export async function getRecentSermons(count = 4): Promise<Sermon[]> {
  if (!has.youtube()) return FALLBACK_SERMONS

  try {
    const manual = manualVideoIds()
    if (manual.length > 0) {
      return await fetchVideos(manual.slice(0, count))
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
    return await fetchVideos(ids)
  } catch {
    return FALLBACK_SERMONS
  }
}

/** 4523 → "1:15:23", 612 → "10:12". Null when the duration is unknown. */
export function formatDuration(seconds: number | null): string | null {
  if (seconds === null || !Number.isFinite(seconds)) return null
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`
  return `${m}:${ss}`
}

/** ISO timestamp → "Aug 24, 2025" (UTC, so the date never shifts by timezone). */
export function formatAirDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}
