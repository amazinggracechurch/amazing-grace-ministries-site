import Section from '@/components/layout/Section'
import SplitSection from '@/components/layout/SplitSection'
import Reveal from '@/components/ui/Reveal'

const areas = [
  {
    title: 'Sunday Services',
    body: 'Funding world-class worship, media, and teaching every single week.',
  },
  {
    title: 'Missions & Outreach',
    body: 'Reaching our city and supporting missionaries around the world.',
  },
  {
    title: 'Discipleship & Education',
    body: 'Bible studies, youth programs, and resources to help people grow.',
  },
  {
    title: 'Community Care',
    body: 'Supporting families in need through our benevolence fund.',
  },
]

/**
 * Where the gift goes — 7/5 asymmetric split. The 100% figure stands as a
 * plain typographic statement rather than a faux-precision stat card.
 * Copy preserved verbatim from the original ImpactSection.
 */
export default function ImpactSection() {
  return (
    <Section rhythm="loose" sunken>
      <SplitSection
        flip
        main={
          <Reveal>
            <p className="eyebrow text-accent">Where It Goes</p>
            <h2 className="mt-4 max-w-lg font-display text-display-md font-medium tracking-display text-text-primary">
              Your Gift <span className="italic">Changes Lives.</span>
            </h2>
            <p className="mt-5 max-w-xl text-subheading text-text-secondary">
              Every dollar given to Amazing Grace Ministries MN goes directly toward building a
              community where people encounter God, find belonging, and discover their purpose.
            </p>
            <dl className="mt-10 max-w-xl border-t border-border-subtle">
              {areas.map((area) => (
                <div
                  key={area.title}
                  className="grid grid-cols-1 gap-1 border-b border-border-subtle py-5 sm:grid-cols-3 sm:gap-6"
                >
                  <dt className="text-body font-semibold text-text-primary">{area.title}</dt>
                  <dd className="text-body-sm text-text-secondary sm:col-span-2">{area.body}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        }
        aside={
          <Reveal delay={1}>
            <div className="border-l-2 border-accent pl-8">
              <p className="eyebrow text-text-muted">Your Impact</p>
              <p className="mt-4 font-display text-display-xl font-light leading-none tracking-display text-text-primary">
                100%
              </p>
              <p className="mt-4 text-subheading text-text-secondary">
                Goes directly to ministry
              </p>
            </div>
          </Reveal>
        }
      />
    </Section>
  )
}
