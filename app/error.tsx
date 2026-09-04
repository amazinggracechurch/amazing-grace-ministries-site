'use client'
import { useEffect } from 'react'
import Button from '@/components/ui/Button'
import { site } from '@/lib/site'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <p className="eyebrow text-accent">Something went wrong</p>
      <h1 className="mt-4 max-w-xl font-display text-display-lg font-light tracking-display text-text-primary">
        We hit an unexpected error.
      </h1>
      <p className="mt-5 max-w-md text-body text-text-secondary">
        This is on us, not you. Try again — and if it keeps happening, reach us at{' '}
        <a
          href={`mailto:${site.contact.email}`}
          className="font-semibold text-accent underline-offset-4 hover:underline"
        >
          {site.contact.email}
        </a>
        .
      </p>
      <div className="mt-8">
        <Button onClick={() => unstable_retry()}>Try Again</Button>
      </div>
    </main>
  )
}
