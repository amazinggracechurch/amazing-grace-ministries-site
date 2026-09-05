'use client'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Checkbox from '@/components/ui/Checkbox'
import type { SiteSettings } from '@/lib/admin/site-settings'

export type SettingsFormProps = {
  initial: SiteSettings
}

type ServiceRow = SiteSettings['services'][number]

/** Editor for the settings/site document. */
export default function SettingsForm({ initial }: SettingsFormProps) {
  const router = useRouter()
  const [address, setAddress] = useState(initial.address)
  const [services, setServices] = useState<ServiceRow[]>(initial.services)
  const [dialInNumbers, setDialInNumbers] = useState(initial.dialIn.numbers.join('\n'))
  const [dialInCode, setDialInCode] = useState(initial.dialIn.code)
  const [contact, setContact] = useState(initial.contact)
  const [socials, setSocials] = useState(initial.socials)
  const [announcement, setAnnouncement] = useState(initial.announcement)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function updateService(index: number, patch: Partial<ServiceRow>) {
    setServices((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeService(index: number) {
    setServices((rows) => rows.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          services,
          dialIn: {
            numbers: dialInNumbers
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean),
            code: dialInCode,
          },
          contact,
          socials,
          announcement,
        }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error ?? 'Could not save settings.')
        return
      }
      router.refresh()
    } catch {
      setError('Could not save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 flex max-w-3xl flex-col gap-12">
      <section>
        <h2 className="font-display text-heading tracking-display text-text-primary">
          Service times
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {services.map((service, index) => (
            <fieldset key={index} className="border border-border-subtle bg-surface-raised p-4">
              <legend className="px-1 text-caption font-semibold uppercase tracking-eyebrow text-text-muted">
                Service {index + 1}
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={service.name}
                  onChange={(event) => updateService(index, { name: event.target.value })}
                />
                <Input
                  label="Day"
                  placeholder="Sundays"
                  value={service.day}
                  onChange={(event) => updateService(index, { day: event.target.value })}
                />
                <Input
                  label="Time"
                  placeholder="09:00 AM"
                  value={service.time}
                  onChange={(event) => updateService(index, { time: event.target.value })}
                />
                <Input
                  label="Note"
                  placeholder="In person & live streamed"
                  value={service.note}
                  onChange={(event) => updateService(index, { note: event.target.value })}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove service ${index + 1}`}
                  onClick={() => removeService(index)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </fieldset>
          ))}
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setServices((rows) => [...rows, { name: '', day: '', time: '', note: '' }])
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Add service
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-heading tracking-display text-text-primary">Address</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label="Street"
            value={address.street}
            onChange={(event) => setAddress({ ...address, street: event.target.value })}
          />
          <Input
            label="City"
            value={address.city}
            onChange={(event) => setAddress({ ...address, city: event.target.value })}
          />
          <Input
            label="State"
            value={address.state}
            onChange={(event) => setAddress({ ...address, state: event.target.value })}
          />
          <Input
            label="ZIP"
            value={address.zip}
            onChange={(event) => setAddress({ ...address, zip: event.target.value })}
          />
          <Input
            label="Country"
            value={address.country}
            onChange={(event) => setAddress({ ...address, country: event.target.value })}
          />
          <Input
            label="Google Maps URL"
            type="url"
            value={address.mapsUrl}
            onChange={(event) => setAddress({ ...address, mapsUrl: event.target.value })}
          />
        </div>
      </section>

      <section>
        <h2 className="font-display text-heading tracking-display text-text-primary">
          Dial-in
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Textarea
            label="Phone numbers"
            rows={3}
            hint="One per line."
            value={dialInNumbers}
            onChange={(event) => setDialInNumbers(event.target.value)}
          />
          <Input
            label="Access code"
            value={dialInCode}
            onChange={(event) => setDialInCode(event.target.value)}
          />
        </div>
      </section>

      <section>
        <h2 className="font-display text-heading tracking-display text-text-primary">
          Contact & socials
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            value={contact.phone}
            onChange={(event) => setContact({ ...contact, phone: event.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={contact.email}
            onChange={(event) => setContact({ ...contact, email: event.target.value })}
          />
          <Input
            label="Facebook URL"
            type="url"
            value={socials.facebook}
            onChange={(event) => setSocials({ ...socials, facebook: event.target.value })}
          />
          <Input
            label="Instagram URL"
            type="url"
            value={socials.instagram}
            onChange={(event) => setSocials({ ...socials, instagram: event.target.value })}
          />
          <Input
            label="YouTube URL"
            type="url"
            value={socials.youtube}
            onChange={(event) => setSocials({ ...socials, youtube: event.target.value })}
          />
        </div>
      </section>

      <section>
        <h2 className="font-display text-heading tracking-display text-text-primary">
          Announcement bar
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          <Checkbox
            label="Show the announcement bar"
            checked={announcement.enabled}
            onChange={(event) =>
              setAnnouncement({ ...announcement, enabled: event.target.checked })
            }
          />
          <Textarea
            label="Announcement text"
            rows={2}
            value={announcement.text}
            onChange={(event) => setAnnouncement({ ...announcement, text: event.target.value })}
          />
        </div>
      </section>

      {error && (
        <p role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  )
}
