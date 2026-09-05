'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import type { Role } from '@/lib/auth/session'

export type MemberRoleSelectProps = {
  uid: string
  /** Who is being changed — shown in the confirm copy. */
  memberLabel: string
  currentRole: Role
  /** True when the signed-in actor is a superadmin (unlocks the superadmin option). */
  allowSuperadmin: boolean
  /** True for the actor's own row — self-demotion would lock the tool. */
  disabled?: boolean
}

const ROLE_COPY: Record<Role, string> = {
  member: 'a regular member — no admin access',
  admin: 'staff — full access to the admin dashboard',
  superadmin: 'superadmin — staff access plus the power to grant roles',
}

/**
 * Inline role changer for the members table. Selecting a new role opens a
 * confirm dialog (focus-trapped); the POST mirrors the claim into the users
 * doc and revokes the member's sessions, so the change takes effect on
 * their next sign-in.
 */
export default function MemberRoleSelect({
  uid,
  memberLabel,
  currentRole,
  allowSuperadmin,
  disabled = false,
}: MemberRoleSelectProps) {
  const router = useRouter()
  const [pendingRole, setPendingRole] = useState<Role | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options: Role[] = allowSuperadmin
    ? ['member', 'admin', 'superadmin']
    : ['member', 'admin']

  async function confirmRole() {
    if (!pendingRole) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/members/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role: pendingRole }),
      })
      if (!response.ok) {
        setError('The role change failed. Try again, or ask a superadmin.')
        return
      }
      setPendingRole(null)
      router.refresh()
    } catch {
      setError('The role change failed. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="relative inline-block">
        <span className="sr-only">
          <label htmlFor={`role-${uid}`}>Role for {memberLabel}</label>
        </span>
        <select
          id={`role-${uid}`}
          value={pendingRole ?? currentRole}
          disabled={disabled || submitting}
          onChange={(event) => {
            const role = event.target.value as Role
            if (role !== currentRole) setPendingRole(role)
          }}
          className="appearance-none border border-border-subtle bg-surface-raised py-1.5 pl-3 pr-8 text-body-sm text-text-primary transition-colors duration-200 focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {options.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-text-muted"
        />
      </div>

      <Dialog
        open={pendingRole !== null}
        onClose={() => {
          if (!submitting) {
            setPendingRole(null)
            setError(null)
          }
        }}
        title="Change member role?"
      >
        {pendingRole && (
          <p className="text-body-sm text-text-secondary">
            Make <strong className="text-text-primary">{memberLabel}</strong>{' '}
            {ROLE_COPY[pendingRole]}? They will be signed out and must sign back in for the
            change to take effect. The change is recorded in the audit log.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-body-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setPendingRole(null)
              setError(null)
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={confirmRole} disabled={submitting}>
            {submitting ? 'Saving…' : 'Change role'}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
