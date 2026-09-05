import 'server-only'
import { createHash } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'

/**
 * Firestore data layer for funding projects (spec §7.3). Server-only —
 * every function talks to Firestore through the Admin SDK.
 *
 * Progress semantics:
 * - `raisedAmountCents` / `donorCount` move only inside
 *   `incrementProjectProgress`, always in a transaction.
 * - `donorCount` counts DISTINCT identified donors: the webhook passes the
 *   donor email, hashed (sha256 of the lowercase address) into
 *   `projects/{id}/donors/{emailHash}`; the counter increments only when
 *   that doc does not yet exist. Anonymous gifts (no email) raise the
 *   amount but never the donor count.
 * - Status auto-flips 'active' -> 'funded' when raised reaches the goal.
 *   Terminal states ('completed'/'archived') are never resurrected.
 *
 * Query-shape note: reads fetch the (small) projects collection whole and
 * filter/sort in memory, avoiding composite-index requirements — same
 * convention as lib/events.ts.
 */

export type ProjectStatus = 'draft' | 'active' | 'funded' | 'completed' | 'archived'

export type Project = {
  id: string
  title: string
  slug: string
  description: string
  coverImage: string | null
  gallery: string[]
  goalAmountCents: number
  raisedAmountCents: number
  pledgedAmountCents: number
  donorCount: number
  /** ISO 8601 date/instant, or null when open-ended. */
  startDate: string | null
  endDate: string | null
  status: ProjectStatus
  featured: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const PROJECT_STATUSES: readonly ProjectStatus[] = [
  'draft',
  'active',
  'funded',
  'completed',
  'archived',
]

/** Public pages only ever surface these. */
const PUBLISHED_STATUSES: readonly ProjectStatus[] = ['active', 'funded']

// --- defensive mapping (Firestore data is untyped; never trust it blindly) ---

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function asCents(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0
}

function toProject(id: string, data: Record<string, unknown>): Project {
  const status = asString(data.status)
  return {
    id,
    title: asString(data.title) ?? 'Untitled project',
    slug: asString(data.slug) ?? id,
    description: asString(data.description) ?? '',
    coverImage: asString(data.coverImage),
    gallery: Array.isArray(data.gallery)
      ? data.gallery.filter((item): item is string => typeof item === 'string')
      : [],
    goalAmountCents: asCents(data.goalAmountCents),
    raisedAmountCents: asCents(data.raisedAmountCents),
    pledgedAmountCents: asCents(data.pledgedAmountCents),
    donorCount: asCents(data.donorCount),
    startDate: asString(data.startDate),
    endDate: asString(data.endDate),
    status: PROJECT_STATUSES.includes(status as ProjectStatus)
      ? (status as ProjectStatus)
      : 'draft',
    featured: data.featured === true,
    sortOrder: asCents(data.sortOrder),
    createdAt: asString(data.createdAt) ?? new Date(0).toISOString(),
    updatedAt: asString(data.updatedAt) ?? new Date(0).toISOString(),
  }
}

/** Lower number sorts first: active campaigns lead, funded ones follow. */
function statusRank(status: ProjectStatus): number {
  return PROJECT_STATUSES.indexOf(status)
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort(
    (a, b) =>
      statusRank(a.status) - statusRank(b.status) ||
      a.sortOrder - b.sortOrder ||
      a.createdAt.localeCompare(b.createdAt)
  )
}

// --- reads ---

export async function listProjects(
  options: { includeUnpublished?: boolean } = {}
): Promise<Project[]> {
  const { includeUnpublished = false } = options
  const snapshot = await adminDb().collection('projects').get()
  const projects = snapshot.docs.map((doc) => toProject(doc.id, doc.data()))
  const visible = includeUnpublished
    ? projects
    : projects.filter((project) => PUBLISHED_STATUSES.includes(project.status))
  return sortProjects(visible)
}

/** Public lookup — returns null for drafts/archived projects as well as misses. */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const snapshot = await adminDb()
    .collection('projects')
    .where('slug', '==', slug)
    .limit(1)
    .get()
  const doc = snapshot.docs[0]
  if (!doc) return null
  const project = toProject(doc.id, doc.data())
  return PUBLISHED_STATUSES.includes(project.status) ? project : null
}

/** Unfiltered lookup by document id (account page joins, webhook paths). */
export async function getProjectById(id: string): Promise<Project | null> {
  const doc = await adminDb().collection('projects').doc(id).get()
  return doc.exists ? toProject(doc.id, doc.data()!) : null
}

/** The featured active campaign for the home band, if one exists. */
export async function getFeaturedProject(): Promise<Project | null> {
  const projects = await listProjects()
  return projects.find((project) => project.featured && project.status === 'active') ?? null
}

// --- writes ---

function donorHash(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

/**
 * Records a successful gift against a project, in one transaction:
 * - raises `raisedAmountCents` by the base gift amount (never the fee),
 * - bumps `donorCount` only when `donorEmail` identifies a donor this
 *   project has not seen before (sha256 of the lowercase email as the doc
 *   id; the raw address is never written),
 * - flips an 'active' project to 'funded' once raised reaches the goal.
 *
 * Anonymous gifts (no email) skip the donor bookkeeping entirely.
 */
export async function incrementProjectProgress(
  projectId: string,
  amountCents: number,
  donorEmail?: string | null
): Promise<void> {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return
  const db = adminDb()
  const projectRef = db.collection('projects').doc(projectId)
  const donorRef = donorEmail
    ? projectRef.collection('donors').doc(donorHash(donorEmail))
    : null

  await db.runTransaction(async (tx) => {
    const projectSnap = await tx.get(projectRef)
    if (!projectSnap.exists) {
      throw new Error(`[projects] incrementProjectProgress: project ${projectId} not found`)
    }
    // All reads happen before any write (Firestore transaction requirement).
    const donorSnap = donorRef ? await tx.get(donorRef) : null

    const project = toProject(projectSnap.id, projectSnap.data()!)
    const isNewDonor = donorRef !== null && donorSnap !== null && !donorSnap.exists

    tx.update(projectRef, {
      raisedAmountCents: FieldValue.increment(amountCents),
      updatedAt: new Date().toISOString(),
      ...(isNewDonor ? { donorCount: FieldValue.increment(1) } : {}),
      ...(project.status === 'active' &&
      project.raisedAmountCents + amountCents >= project.goalAmountCents
        ? { status: 'funded' }
        : {}),
    })
    if (isNewDonor && donorRef) {
      tx.set(donorRef, { firstGiftAt: new Date().toISOString() })
    }
  })
}
