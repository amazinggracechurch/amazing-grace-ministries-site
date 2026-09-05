/**
 * Interest groups a member can mark in their portal profile
 * (users/{uid}.interests). Used for ministry communication segments —
 * e.g. emailing everyone interested in a group. Client-safe.
 */
export const INTEREST_GROUPS = [
  "Children's Ministry",
  'Bible Study',
  'Prayer & Intercession',
  'Outreach & Missions',
  'Worship & Media',
  'Young Adults (Christlike)',
  'Community Groups',
  'Volunteering',
] as const

export type InterestGroup = (typeof INTEREST_GROUPS)[number]
