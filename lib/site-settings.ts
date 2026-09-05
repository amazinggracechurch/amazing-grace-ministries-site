import 'server-only'
import { has } from '@/lib/env'
import {
  defaultSiteSettings,
  readSiteSettings,
  type SiteSettings,
} from '@/lib/admin/site-settings'

const SITE_SETTINGS_TTL_MS = 5 * 60 * 1000

// Module cache for the public read side: reads within the TTL are free;
// the first read after expiry refetches. The admin settings route clears
// it on save so edits show up immediately on the same server.
let siteSettingsCache: { settings: SiteSettings; fetchedAt: number } | null = null

/** Drop the cached settings (called by the admin settings route after a save). */
export function clearSiteSettingsCache(): void {
  siteSettingsCache = null
}

/**
 * The `settings/site` doc for public pages. Falls back to the lib/site.ts
 * seed defaults when Firebase Admin is unconfigured or the read fails —
 * public pages must never throw on settings trouble. Cached 5 minutes
 * per server instance.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (!has.firebaseAdmin()) return defaultSiteSettings()

  const now = Date.now()
  if (siteSettingsCache && now - siteSettingsCache.fetchedAt < SITE_SETTINGS_TTL_MS) {
    return siteSettingsCache.settings
  }

  try {
    const settings = await readSiteSettings()
    siteSettingsCache = { settings, fetchedAt: now }
    return settings
  } catch {
    return defaultSiteSettings()
  }
}
