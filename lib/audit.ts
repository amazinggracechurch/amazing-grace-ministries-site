import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Audit log — every admin write records who, what, when, before/after.
 * Non-negotiable for anything touching money (spec §7.6).
 * Firestore `audit_log/{id}` — append-only from the Admin SDK.
 */

export type AuditEntry = {
  actorUid: string
  actorEmail: string | null
  /** e.g. 'create' | 'update' | 'delete' | 'refund' | 'role' */
  action: string
  collection: string
  docId: string
  before?: unknown
  after?: unknown
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await adminDb()
      .collection('audit_log')
      .add({ ...entry, at: FieldValue.serverTimestamp() })
  } catch (error) {
    // Auditing must never break the operation it accompanies — but the
    // failure is loud in the logs.
    console.error('[audit] failed to record', {
      action: entry.action,
      collection: entry.collection,
      message: error instanceof Error ? error.message : 'unknown',
    })
  }
}
