import { adminBucket } from '@/lib/firebase/admin'
import { recordAudit } from '@/lib/audit'
import { adminGuard } from '@/lib/admin/guard'

/**
 * Admin image upload. POST multipart/form-data with a single `file` field.
 *
 * - requireAdmin first — Storage writes are privileged.
 * - Validates content-type image/* and a 10 MB ceiling.
 * - Stores at `uploads/<timestamp>-<safe-name>` and calls makePublic(), so
 *   the returned URL is the plain public object URL
 *   (https://storage.googleapis.com/<bucket>/<object>). makePublic was
 *   chosen over signed URLs: uploaded artwork is site content meant to be
 *   hot-linked by public pages forever, and a far-future signed URL still
 *   expires eventually. Bucket-level uniform access must allow public
 *   reads for these objects (see storage.rules / bucket IAM).
 */
const MAX_BYTES = 10 * 1024 * 1024

/** Lowercase, strip anything that isn't safe in an object name. */
function safeName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'upload'
  return base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'upload'
}

export async function POST(request: Request) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ error: 'Expected multipart form data.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'No file provided.' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return Response.json({ error: 'Only image files are allowed.' }, { status: 400 })
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return Response.json({ error: 'File must be an image up to 10 MB.' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const objectName = `uploads/${Date.now()}-${safeName(file.name)}`
    const bucket = adminBucket()
    const stored = bucket.file(objectName)
    await stored.save(buffer, {
      contentType: file.type,
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    })
    await stored.makePublic()
    const url = `https://storage.googleapis.com/${bucket.name}/${objectName}`

    await recordAudit({
      actorUid: guard.user.uid,
      actorEmail: guard.user.email,
      action: 'upload',
      collection: 'storage',
      docId: objectName,
      after: { url, contentType: file.type, bytes: file.size },
    })

    return Response.json({ ok: true, url })
  } catch (error) {
    console.error('[admin/upload] failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
