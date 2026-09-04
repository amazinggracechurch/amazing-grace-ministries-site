import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <p className="eyebrow text-accent">Page not found</p>
      <h1 className="mt-4 max-w-xl font-display text-display-lg font-light tracking-display text-text-primary">
        This page wandered off.
      </h1>
      <p className="mt-5 max-w-md text-body text-text-secondary">
        The page you are looking for does not exist or may have moved. Let us help
        you find your way back.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button href="/">Back to Home</Button>
        <Link
          href="/plan-your-visit"
          className="text-body font-semibold text-accent underline-offset-4 transition-colors duration-200 hover:text-accent-hover hover:underline"
        >
          Plan Your Visit
        </Link>
      </div>
    </main>
  )
}
