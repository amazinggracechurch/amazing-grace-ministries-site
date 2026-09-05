'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { INTEREST_GROUPS } from '@/lib/member-groups'

export type ProfileFormValues = {
  displayName: string
  phone: string
  birthdate: string
  interests: string[]
  emailUpdates: boolean
  pledgeReminders: boolean
}

/**
 * Edits the member profile (users/{uid}) via /api/account/profile. The
 * server validates with zod and merges — it never overwrites role or
 * other account fields. Success is confirmed inline; router.refresh()
 * re-renders the server components with the new values.
 */
export default function ProfileForm({ initial }: { initial: ProfileFormValues }) {
  const router = useRouter()
  const [values, setValues] = useState<ProfileFormValues>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setError(null)
    setSaved(false)
    setSubmitting(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: values.displayName,
          phone: values.phone,
          birthdate: values.birthdate,
          interests: values.interests,
          communicationPrefs: {
            emailUpdates: values.emailUpdates,
            pledgeReminders: values.pledgeReminders,
          },
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
      }
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-6">
      <Input
        label="Full name"
        name="displayName"
        value={values.displayName}
        onChange={(event) => {
          setValues((v) => ({ ...v, displayName: event.target.value }))
          setSaved(false)
        }}
        required
        maxLength={100}
        autoComplete="name"
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        value={values.phone}
        onChange={(event) => {
          setValues((v) => ({ ...v, phone: event.target.value }))
          setSaved(false)
        }}
        maxLength={40}
        autoComplete="tel"
        hint="Optional — only used if the church office needs to reach you."
      />
      <Input
        label="Birthdate"
        name="birthdate"
        type="date"
        value={values.birthdate}
        onChange={(event) => {
          setValues((v) => ({ ...v, birthdate: event.target.value }))
          setSaved(false)
        }}
        autoComplete="bday"
        hint="Optional — so we can celebrate with you."
      />

      <fieldset className="flex flex-col gap-4">
        <legend className="text-body-sm font-semibold text-text-primary">
          I&apos;m interested in
        </legend>
        <p className="-mt-2 text-caption text-text-muted">
          Helps us share what matters to you — group news, serving opportunities, and events.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {INTEREST_GROUPS.map((group) => (
            <Checkbox
              key={group}
              label={group}
              checked={values.interests.includes(group)}
              onChange={(event) => {
                setValues((v) => ({
                  ...v,
                  interests: event.target.checked
                    ? [...v.interests, group]
                    : v.interests.filter((i) => i !== group),
                }))
                setSaved(false)
              }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-body-sm font-semibold text-text-primary">
          Communication preferences
        </legend>
        <Checkbox
          label="Email updates"
          hint="Occasional news and announcements from the church."
          checked={values.emailUpdates}
          onChange={(event) => {
            setValues((v) => ({ ...v, emailUpdates: event.target.checked }))
            setSaved(false)
          }}
        />
        <Checkbox
          label="Pledge reminders"
          hint="A gentle nudge when one of your pledges is still open."
          checked={values.pledgeReminders}
          onChange={(event) => {
            setValues((v) => ({ ...v, pledgeReminders: event.target.checked }))
            setSaved(false)
          }}
        />
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner size="sm" /> Saving…
            </>
          ) : (
            'Save changes'
          )}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-success">
            <Check className="size-4" aria-hidden /> Saved — your profile is up to date.
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      )}
    </form>
  )
}
