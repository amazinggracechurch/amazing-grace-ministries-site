'use client'
import { CalendarX } from 'lucide-react'
import Image from 'next/image'
import { useState, type ReactNode } from 'react'
import Accordion from '@/components/ui/Accordion'
import Avatar from '@/components/ui/Avatar'
import Badge, { type BadgeVariant } from '@/components/ui/Badge'
import Button, { type ButtonVariant } from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Checkbox from '@/components/ui/Checkbox'
import Dialog from '@/components/ui/Dialog'
import Drawer from '@/components/ui/Drawer'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import ProgressBar from '@/components/ui/ProgressBar'
import RadioGroup from '@/components/ui/RadioGroup'
import Select from '@/components/ui/Select'
import Skeleton from '@/components/ui/Skeleton'
import Spinner from '@/components/ui/Spinner'
import Tabs from '@/components/ui/Tabs'
import Textarea from '@/components/ui/Textarea'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'

/* -------------------------------------------------------------------------- */
/*  Guide scaffolding                                                          */
/* -------------------------------------------------------------------------- */

const toc = [
  ['colors', 'Colors'],
  ['typography', 'Typography'],
  ['buttons', 'Buttons'],
  ['badges', 'Badges'],
  ['cards', 'Cards'],
  ['form-fields', 'Form fields'],
  ['choice-controls', 'Choice controls'],
  ['tabs', 'Tabs'],
  ['accordion', 'Accordion'],
  ['overlays', 'Dialog and Drawer'],
  ['toasts', 'Toasts'],
  ['feedback', 'Feedback'],
  ['avatar', 'Avatar'],
  ['pagination', 'Pagination'],
  ['empty-state', 'Empty state'],
] as const

function GuideSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-8">
      <p className="eyebrow mb-3 text-accent">{eyebrow}</p>
      <h2
        id={`${id}-title`}
        className="font-display text-display-md tracking-display text-text-primary"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-2xl text-body text-text-secondary">{description}</p>
      )}
      <div className="mt-8 space-y-8">{children}</div>
    </section>
  )
}

function DemoLabel({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-3 text-text-muted">{children}</p>
}

/**
 * Renders a demo twice: once in the ambient theme, once forced dark via a
 * scoped .dark wrapper (the dark variant is `&:where(.dark, .dark *)`).
 */
function ThemePair({ render }: { render: (theme: 'current' | 'dark') => ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-card border border-border-subtle bg-surface p-6">
        <p className="eyebrow mb-5 text-text-muted">Current theme</p>
        {render('current')}
      </div>
      <div className="dark rounded-card border border-border-subtle bg-surface p-6 text-text-primary">
        <p className="eyebrow mb-5 text-text-muted">Forced dark</p>
        {render('dark')}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Color tokens                                                               */
/* -------------------------------------------------------------------------- */

const swatchGroups: { title: string; swatches: { token: string; className: string }[] }[] = [
  {
    title: 'Surfaces',
    swatches: [
      { token: 'bg-surface', className: 'bg-surface' },
      { token: 'bg-surface-raised', className: 'bg-surface-raised' },
      { token: 'bg-surface-sunken', className: 'bg-surface-sunken' },
    ],
  },
  {
    title: 'Borders',
    swatches: [
      { token: 'border-border-subtle', className: 'bg-border-subtle' },
      { token: 'border-border-strong', className: 'bg-border-strong' },
    ],
  },
  {
    title: 'Text',
    swatches: [
      { token: 'text-text-primary', className: 'bg-text-primary' },
      { token: 'text-text-secondary', className: 'bg-text-secondary' },
      { token: 'text-text-muted', className: 'bg-text-muted' },
    ],
  },
  {
    title: 'Accent',
    swatches: [
      { token: 'bg-accent / text-accent', className: 'bg-accent' },
      { token: 'bg-accent-hover', className: 'bg-accent-hover' },
      { token: 'bg-accent-subtle', className: 'bg-accent-subtle' },
      { token: 'text-on-accent', className: 'bg-on-accent' },
    ],
  },
  {
    title: 'Status',
    swatches: [
      { token: 'text-success', className: 'bg-success' },
      { token: 'text-warning', className: 'bg-warning' },
      { token: 'text-danger', className: 'bg-danger' },
    ],
  },
]

function Swatch({ token, className }: { token: string; className: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={cn('size-10 shrink-0 border border-border-subtle', className)}
      />
      <code className="text-caption text-text-secondary">{token}</code>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Type scale                                                                 */
/* -------------------------------------------------------------------------- */

const typeScale: { token: string; className: string; sample: string }[] = [
  { token: 'text-display-xl', className: 'font-display text-display-xl tracking-display', sample: 'Grace' },
  { token: 'text-display-lg', className: 'font-display text-display-lg tracking-display', sample: 'Grace' },
  { token: 'text-display-md', className: 'font-display text-display-md tracking-display', sample: 'Grace upon grace' },
  { token: 'text-heading', className: 'font-display text-heading tracking-display', sample: 'A quiet confidence' },
  { token: 'text-subheading', className: 'text-subheading', sample: 'Join us this Sunday at 10:00 AM' },
  { token: 'text-body', className: 'text-body', sample: 'Body text carries most of the page, set in Nunito.' },
  { token: 'text-body-sm', className: 'text-body-sm', sample: 'Small body text for supporting detail.' },
  { token: 'text-caption', className: 'text-caption', sample: 'Captions, metadata, and fine print.' },
  { token: 'eyebrow', className: 'eyebrow', sample: 'Eyebrow label' },
]

/* -------------------------------------------------------------------------- */
/*  Interactive demos                                                          */
/* -------------------------------------------------------------------------- */

function DialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Plan your visit">
        <p className="text-body text-text-secondary">
          We gather every Sunday at 10:00 AM. Come as you are — there is
          coffee in the lobby and someone at the door to say hello.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Maybe later
          </Button>
          <Button onClick={() => setOpen(false)}>Save my seat</Button>
        </div>
      </Dialog>
    </div>
  )
}

function DrawerDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Menu">
        <nav aria-label="Drawer demo">
          <ul className="flex flex-col gap-1">
            {['About', 'Sermons', 'Events', 'Give', 'Contact'].map((item) => (
              <li key={item}>
                <a
                  href="#overlays"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-body text-text-secondary transition-colors duration-200 hover:bg-surface-sunken hover:text-text-primary"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </div>
  )
}

function ToastDemo() {
  const { toast } = useToast()
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => toast('Your message has been received.')}>
        Neutral toast
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast('Gift received. Thank you for giving.', { variant: 'success' })}
      >
        Success toast
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast('Something went wrong. Please try again.', { variant: 'danger' })}
      >
        Danger toast
      </Button>
    </div>
  )
}

function PaginationDemo() {
  const [page, setPage] = useState(5)
  return (
    <div className="space-y-3">
      <Pagination page={page} totalPages={12} onPageChange={setPage} />
      <p className="text-caption text-text-muted">Page {page} of 12</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function StyleguideClient() {
  return (
    <ToastProvider>
      <div className="mx-auto max-w-7xl px-6 py-16 lg:flex lg:gap-12">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav aria-label="Styleguide contents" className="sticky top-8">
            <p className="eyebrow mb-4 text-text-muted">Contents</p>
            <ul className="flex flex-col gap-1 border-l border-border-subtle">
              {toc.map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="-ml-px block border-l-2 border-transparent py-1 pl-4 text-body-sm text-text-secondary transition-colors duration-200 hover:border-accent hover:text-accent"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-24">
          <header>
            <p className="eyebrow mb-4 text-accent">Internal — do not index</p>
            <h1 className="font-display text-display-lg tracking-display text-text-primary">
              Styleguide
            </h1>
            <p className="mt-4 max-w-2xl text-subheading text-text-secondary">
              Every token and primitive in the design system. Key sections render
              twice: once in the ambient theme, once in a scoped dark wrapper.
              Toggle the site theme to flip the left column.
            </p>
          </header>

          <GuideSection
            id="colors"
            eyebrow="Tokens"
            title="Colors"
            description="Semantic tokens only — they swap between warm paper and dim sanctuary automatically."
          >
            <ThemePair
              render={(theme) => (
                <div className="space-y-6">
                  {swatchGroups.map((group) => (
                    <div key={`${theme}-${group.title}`}>
                      <DemoLabel>{group.title}</DemoLabel>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {group.swatches.map((swatch) => (
                          <Swatch key={swatch.token} {...swatch} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            />
          </GuideSection>

          <GuideSection
            id="typography"
            eyebrow="Tokens"
            title="Typography"
            description="The full type scale — the only font sizes in the system. Display steps set in Cormorant Garamond, everything else in Nunito."
          >
            <div className="rounded-card border border-border-subtle bg-surface-raised p-6">
              {typeScale.map((step) => (
                <div
                  key={step.token}
                  className="flex flex-col gap-2 border-b border-border-subtle py-5 last:border-b-0 last:pb-0 first:pt-0"
                >
                  <code className="text-caption text-text-muted">{step.token}</code>
                  <p className={cn(step.className, 'text-text-primary')}>{step.sample}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="buttons"
            eyebrow="Primitive"
            title="Buttons"
            description="Four variants, three sizes. Hover is a 2px lift or a color change, never both beyond that."
          >
            <ThemePair
              render={(theme) => (
                <div>
                  {(['primary', 'secondary', 'ghost', 'link'] as ButtonVariant[]).map((variant) => (
                    <div key={`${theme}-${variant}`} className="mb-6 last:mb-0">
                      <DemoLabel>{variant}</DemoLabel>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button variant={variant} size="sm">
                          Small
                        </Button>
                        <Button variant={variant} size="md">
                          Medium
                        </Button>
                        <Button variant={variant} size="lg">
                          Large
                        </Button>
                        <Button variant={variant} disabled>
                          Disabled
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="mt-8 border-t border-border-subtle pt-6">
                    <DemoLabel>href rendering and loading</DemoLabel>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button href="#buttons" variant="secondary">
                        Rendered as a link
                      </Button>
                      <Button href="#buttons" disabled>
                        Disabled link
                      </Button>
                      <Button disabled>
                        <Spinner size="sm" /> Sending
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            />
          </GuideSection>

          <GuideSection id="badges" eyebrow="Primitive" title="Badges">
            <ThemePair
              render={(theme) => (
                <div className="flex flex-wrap items-center gap-3">
                  {(['neutral', 'accent', 'success', 'warning', 'danger'] as BadgeVariant[]).map(
                    (variant) => (
                      <Badge key={`${theme}-${variant}`} variant={variant}>
                        {variant}
                      </Badge>
                    )
                  )}
                </div>
              )}
            />
          </GuideSection>

          <GuideSection id="cards" eyebrow="Primitive" title="Cards">
            <ThemePair
              render={() => (
                <div className="space-y-6">
                  <Card>
                    <h3 className="font-display text-heading tracking-display text-text-primary">
                      Default card
                    </h3>
                    <p className="mt-2 text-body-sm text-text-secondary">
                      Raised surface, subtle border, card shadow. Quiet by default.
                    </p>
                  </Card>
                  <Card hoverable>
                    <h3 className="font-display text-heading tracking-display text-text-primary">
                      Hoverable
                    </h3>
                    <p className="mt-2 text-body-sm text-text-secondary">
                      Lifts 2px with a deeper shadow — reserved for linked cards.
                    </p>
                  </Card>
                  <Card
                    padded={false}
                    media={
                      <Image
                        src="/images/hero-worship.jpg"
                        alt="Congregation gathered on a Sunday morning"
                        width={800}
                        height={450}
                        className="h-40 w-full object-cover"
                      />
                    }
                  >
                    <div className="p-6">
                      <h3 className="font-display text-heading tracking-display text-text-primary">
                        With media slot
                      </h3>
                      <p className="mt-2 text-body-sm text-text-secondary">
                        Media sits flush at the top, corners clipped to the card radius.
                      </p>
                    </div>
                  </Card>
                </div>
              )}
            />
          </GuideSection>

          <GuideSection
            id="form-fields"
            eyebrow="Primitive"
            title="Form fields"
            description="Visible labels, hints, and error text wired with aria-describedby and aria-invalid."
          >
            <ThemePair
              render={() => (
                <div className="space-y-6">
                  <Input label="Full name" placeholder="Jane Mensah" />
                  <Input
                    label="Email"
                    type="email"
                    hint="We only use this to reply to you."
                    placeholder="jane@example.com"
                  />
                  <Input
                    label="Phone"
                    error="Enter a valid phone number."
                    defaultValue="abc"
                  />
                  <Input label="Disabled" disabled placeholder="Not available right now" />
                  <Textarea
                    label="Prayer request"
                    hint="Shared only with the prayer team."
                    placeholder="How can we pray for you?"
                  />
                  <Textarea label="With error" error="Tell us a little more." />
                  <Select label="Service time" defaultValue="sunday">
                    <option value="sunday">Sunday, 10:00 AM</option>
                    <option value="wednesday">Wednesday, 6:30 PM</option>
                  </Select>
                  <Select label="Disabled select" disabled defaultValue="a">
                    <option value="a">Unavailable</option>
                  </Select>
                </div>
              )}
            />
          </GuideSection>

          <GuideSection
            id="choice-controls"
            eyebrow="Primitive"
            title="Choice controls"
            description="Native inputs underneath, so keyboard behavior — including radio arrow keys — comes from the browser."
          >
            <ThemePair
              render={(theme) => (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <DemoLabel>Checkbox</DemoLabel>
                    <Checkbox label="Send me the weekly newsletter" />
                    <Checkbox
                      label="I would like a call from a pastor"
                      hint="We will reach out within a few days."
                      defaultChecked
                    />
                    <Checkbox label="Disabled option" disabled />
                  </div>
                  <DemoLabel>Radio group</DemoLabel>
                  <RadioGroup
                    legend="How did you hear about us?"
                    name={`heard-${theme}`}
                    defaultValue="friend"
                    options={[
                      { value: 'friend', label: 'A friend invited me' },
                      { value: 'search', label: 'Online search' },
                      { value: 'drive', label: 'Drove by the building', disabled: true },
                    ]}
                  />
                  <RadioGroup
                    legend="Horizontal"
                    name={`horiz-${theme}`}
                    direction="horizontal"
                    defaultValue="yes"
                    options={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                      { value: 'maybe', label: 'Maybe' },
                    ]}
                  />
                  <RadioGroup
                    legend="With error"
                    name={`error-${theme}`}
                    error="Choose one to continue."
                    options={[
                      { value: 'a', label: 'Option A' },
                      { value: 'b', label: 'Option B' },
                    ]}
                  />
                </div>
              )}
            />
          </GuideSection>

          <GuideSection
            id="tabs"
            eyebrow="Primitive"
            title="Tabs"
            description="Roving tabindex with arrow-key navigation and automatic activation."
          >
            <Tabs
              tabs={[
                {
                  value: 'sunday',
                  label: 'Sunday',
                  panel: (
                    <p className="text-body text-text-secondary">
                      Worship at 10:00 AM, followed by coffee and conversation in the
                      fellowship hall.
                    </p>
                  ),
                },
                {
                  value: 'wednesday',
                  label: 'Wednesday',
                  panel: (
                    <p className="text-body text-text-secondary">
                      Midweek Bible study at 6:30 PM. Bring a Bible and your questions.
                    </p>
                  ),
                },
                {
                  value: 'friday',
                  label: 'Friday',
                  panel: (
                    <p className="text-body text-text-secondary">
                      Youth night, twice a month. Check the events page for dates.
                    </p>
                  ),
                },
                {
                  value: 'disabled',
                  label: 'Disabled',
                  disabled: true,
                  panel: null,
                },
              ]}
            />
          </GuideSection>

          <GuideSection id="accordion" eyebrow="Primitive" title="Accordion">
            <div className="space-y-10">
              <div>
                <DemoLabel>Single open</DemoLabel>
                <Accordion
                  defaultOpen={[0]}
                  items={[
                    {
                      title: 'What time is the service?',
                      content: 'Sundays at 10:00 AM. Doors open thirty minutes early.',
                    },
                    {
                      title: 'What should I wear?',
                      content: 'Whatever is comfortable. You will see everything from jeans to suits.',
                    },
                    {
                      title: 'Is there something for my kids?',
                      content: 'Yes — a staffed nursery and children’s church during the sermon.',
                    },
                  ]}
                />
              </div>
              <div>
                <DemoLabel>Allow multiple</DemoLabel>
                <Accordion
                  allowMultiple
                  items={[
                    {
                      title: 'Where do I park?',
                      content: 'The lot off Edgerton Street has visitor spaces near the main door.',
                    },
                    {
                      title: 'How do I become a member?',
                      content: 'Talk to a pastor after any service, or use the contact form.',
                    },
                  ]}
                />
              </div>
            </div>
          </GuideSection>

          <GuideSection
            id="overlays"
            eyebrow="Primitive"
            title="Dialog and Drawer"
            description="Both trap focus, close on Esc and outside click, lock scroll, and restore focus on close."
          >
            <div className="flex flex-wrap gap-4">
              <DialogDemo />
              <DrawerDemo />
            </div>
          </GuideSection>

          <GuideSection
            id="toasts"
            eyebrow="Primitive"
            title="Toasts"
            description="Announced via an aria-live polite region; auto-dismiss after five seconds."
          >
            <ToastDemo />
          </GuideSection>

          <GuideSection
            id="feedback"
            eyebrow="Primitives"
            title="Spinner, Skeleton, ProgressBar"
          >
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <DemoLabel>Spinner</DemoLabel>
                <div className="flex items-center gap-6">
                  <Spinner size="sm" />
                  <Spinner size="md" />
                  <Spinner size="lg" />
                  <span className="flex items-center gap-2 text-body-sm text-text-secondary">
                    <Spinner size="sm" /> Loading sermons
                  </span>
                </div>
              </div>
              <div>
                <DemoLabel>Progress bar</DemoLabel>
                <div className="space-y-6">
                  <ProgressBar value={40} label="Without pledges" />
                  <ProgressBar value={65} pledged={85} label="Building fund — raised, pledged behind" />
                </div>
              </div>
            </div>
            <div>
              <DemoLabel>Skeleton</DemoLabel>
              <div className="rounded-card border border-border-subtle bg-surface-raised p-6">
                <div className="flex items-center gap-4">
                  <Skeleton shape="circle" className="size-12" />
                  <div className="flex-1 space-y-2">
                    <Skeleton shape="line" className="w-1/3" />
                    <Skeleton shape="line" className="w-1/2" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <Skeleton shape="line" />
                  <Skeleton shape="line" />
                  <Skeleton shape="line" className="w-2/3" />
                </div>
                <Skeleton shape="block" className="mt-6" />
              </div>
            </div>
          </GuideSection>

          <GuideSection id="avatar" eyebrow="Primitive" title="Avatar">
            <div className="flex flex-wrap items-end gap-6">
              <Avatar src="/images/pastor-nnaemeka.jpg" name="Pastor Nnaemeka" size="sm" />
              <Avatar src="/images/pastor-nnaemeka.jpg" name="Pastor Nnaemeka" size="md" />
              <Avatar src="/images/pastor-nnaemeka.jpg" name="Pastor Nnaemeka" size="lg" />
              <Avatar name="Grace Osei" size="sm" />
              <Avatar name="Grace Osei" size="md" />
              <Avatar name="Grace Osei" size="lg" />
            </div>
          </GuideSection>

          <GuideSection
            id="pagination"
            eyebrow="Primitive"
            title="Pagination"
            description="Button mode here; pass hrefFor to render links instead."
          >
            <PaginationDemo />
          </GuideSection>

          <GuideSection id="empty-state" eyebrow="Primitive" title="Empty state">
            <EmptyState
              icon={<CalendarX className="size-6" aria-hidden="true" />}
              title="No upcoming events"
              body="There is nothing on the calendar right now. Check back soon, or browse what has already happened."
              action={<Button variant="secondary">Browse past events</Button>}
            />
          </GuideSection>
        </main>
      </div>
    </ToastProvider>
  )
}
