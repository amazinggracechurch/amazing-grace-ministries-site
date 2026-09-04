import Section from '@/components/layout/Section'
import SectionHeading from '@/components/layout/SectionHeading'
import Reveal from '@/components/ui/Reveal'

const values = [
  {
    num: '01',
    name: 'WORD-CENTERED',
    body: 'Everything we do is anchored in Scripture. We preach, teach, and live the uncompromising truth of God\u2019s Word through engaging sermons and interactive Bible studies.',
  },
  {
    num: '02',
    name: 'SPIRIT-LED',
    body: 'We create space for the Holy Spirit to move. We believe in authentic, Spirit-filled worship and Spirit-empowered living \u2014 including our Open Heavens prayer gatherings.',
  },
  {
    num: '03',
    name: 'COMMUNITY-DRIVEN',
    body: 'We do life together. Real relationships, real accountability, and real love for one another are at the core of who we are as the Amazing Family.',
  },
  {
    num: '04',
    name: 'MISSION-FOCUSED',
    body: 'We exist not just for ourselves but for our city and the world. We are dedicated to spreading hope, love, and the teachings of Christ beyond our walls.',
  },
]

/**
 * Our Values — a quiet two-column text grid. No icons, no borders;
 * the words carry it. Copy preserved verbatim from the original OurValues.
 */
export default function OurValues() {
  return (
    <Section rhythm="dense" sunken>
      <Reveal>
        <SectionHeading eyebrow="How We Live" title="Our Core Values" />
        <p className="mt-5 max-w-2xl text-body text-text-secondary">
          At Amazing Grace Ministries, we believe that spiritual growth is a lifelong journey that
          deepens our relationship with God and enriches our lives. We provide a nurturing
          environment where individuals can explore their faith through engaging sermons,
          interactive Bible studies, and personal prayer sessions.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
        {values.map((value, i) => (
          <Reveal key={value.num} delay={Math.min(i, 4) as 0 | 1 | 2 | 3 | 4}>
            <p className="text-caption font-semibold tracking-wide text-text-muted">{value.num}</p>
            <h3 className="mt-2 font-display text-heading font-medium text-text-primary">
              {value.name}
            </h3>
            <p className="mt-3 max-w-md text-body text-text-secondary">{value.body}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
