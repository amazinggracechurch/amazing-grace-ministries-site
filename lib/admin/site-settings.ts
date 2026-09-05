import 'server-only'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase/admin'
import { site } from '@/lib/site'

/**
 * The editable `settings/site` document. Seeded from the lib/site.ts
 * constants when the doc doesn't exist yet.
 *
 * NOTE: the public site still reads the lib/site.ts constants directly —
 * this doc is the future source of truth; rewiring public reads is a
 * later task.
 */

export const SITE_SETTINGS_DOC = 'settings/site'

const serviceRowSchema = z.object({
  name: z.string().trim().min(1, 'Service name is required.').max(120),
  day: z.string().trim().min(1, 'Day is required.').max(120),
  time: z.string().trim().min(1, 'Time is required.').max(120),
  note: z.string().trim().max(200),
})

export const siteSettingsSchema = z.object({
  address: z.object({
    street: z.string().trim().min(1, 'Street is required.').max(200),
    city: z.string().trim().min(1, 'City is required.').max(120),
    state: z.string().trim().min(1, 'State is required.').max(40),
    zip: z.string().trim().min(1, 'ZIP is required.').max(20),
    country: z.string().trim().min(1).max(80),
    mapsUrl: z.union([z.literal(''), z.url('Must be a full URL (https://…).')]),
  }),
  services: z.array(serviceRowSchema).min(1, 'Keep at least one service row.').max(20),
  dialIn: z.object({
    numbers: z.array(z.string().trim().min(1).max(40)).max(10),
    code: z.string().trim().max(40),
  }),
  contact: z.object({
    phone: z.string().trim().max(40),
    email: z.union([z.literal(''), z.email('Must be a valid email address.')]),
  }),
  socials: z.object({
    facebook: z.union([z.literal(''), z.url('Must be a full URL (https://…).')]),
    instagram: z.union([z.literal(''), z.url('Must be a full URL (https://…).')]),
    youtube: z.union([z.literal(''), z.url('Must be a full URL (https://…).')]),
  }),
  announcement: z.object({
    enabled: z.boolean(),
    text: z.string().trim().max(300),
  }),
})

export type SiteSettings = z.infer<typeof siteSettingsSchema>

/** Defaults built from the current hardcoded constants. */
export function defaultSiteSettings(): SiteSettings {
  return {
    address: { ...site.address },
    services: site.services.map((service) => ({ ...service })),
    dialIn: { numbers: [...site.dialIn.numbers], code: site.dialIn.code },
    contact: { ...site.contact },
    socials: { ...site.socials },
    announcement: { enabled: false, text: '' },
  }
}

/** The stored settings doc, or the seeded defaults when not yet saved. */
export async function readSiteSettings(): Promise<SiteSettings> {
  const doc = await adminDb().doc(SITE_SETTINGS_DOC).get()
  if (!doc.exists) return defaultSiteSettings()
  const parsed = siteSettingsSchema.safeParse(doc.data())
  return parsed.success ? parsed.data : defaultSiteSettings()
}

export async function writeSiteSettings(settings: SiteSettings): Promise<void> {
  await adminDb()
    .doc(SITE_SETTINGS_DOC)
    .set({ ...settings, updatedAt: new Date().toISOString() })
}
