import Section from '@/components/layout/Section'
import SectionHeading from '@/components/layout/SectionHeading'
import Reveal from '@/components/ui/Reveal'
import { getSiteSettings } from '@/lib/site-settings'

/**
 * The recurring gatherings as an editorial list — name, cadence, and
 * description set in type, deliberately distinct from the card grid above.
 */
export default async function RecurringRhythms() {
  const settings = await getSiteSettings()
  const dialIn = `Audio: ${settings.dialIn.numbers[0]} · Code: ${settings.dialIn.code}`

  const recurring = [
    {
      title: 'SUNDAY SERVICE',
      subtitle: '',
      desc: 'Our weekly family gathering — Spirit-filled worship, powerful teaching, and authentic community.',
      time: '09:00 AM Every Sunday',
      loc: 'Main Sanctuary',
    },
     {
      title: 'BIBLE STUDY',
      subtitle: 'Digging For Hidden Treasures',
      desc: 'On Mondays, we study to shew ourselves approved as workmen that need not be afraid, rightly dividing the word of truth.',
      time: 'Every Monday',
      loc: dialIn,
    },
     {
      title: 'Christlike',
      subtitle: 'Young Adult Bible Study',
      desc: 'A time for youth and young adults to come together to study the Bible and learn about God. It is a great opportunity for young people to get to know each other and to build relationships with each other.',
      time: 'Every Tuesday',
      loc: 'Main Sanctuary',
    },
    {
      title: 'HOUR OF BATTLE',
      subtitle: 'Wednesday Midweek Service',
      desc: 'On Wednesdays, we gather weekly to pray fervently until something happens. All are welcome to join in person or by audio conference.',
      time: 'Every Wednesday',
      loc: dialIn,
    },

    {
      title: 'OPEN HEAVENS',
      subtitle: 'Monthly Prayer Gathering',
      desc: 'Start the month with a supercharge of prayer and set your mind in tune with God. This is our most powerful corporate prayer experience.',
      time: '1st Saturday of Every Month',
      loc: 'Main Sanctuary',
    },
  ]

  return (
    <Section rhythm="normal" sunken>
      <Reveal>
        <SectionHeading
          eyebrow="Every Week"
          title="Our Weekly Rhythm"
          lede="Beyond special events, these gatherings happen every single week. You're always welcome."
        />
      </Reveal>

      <div className="mt-12 border-t border-border-subtle">
        {recurring.map((item, i) => (
          <Reveal key={item.title} delay={Math.min(i, 4) as 0 | 1 | 2 | 3 | 4}>
            <article className="grid gap-3 border-b border-border-subtle py-8 md:grid-cols-12 md:gap-8">
              <div className="md:col-span-4">
                <h3 className="font-display text-heading tracking-display text-text-primary">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="mt-1 font-display text-subheading italic text-accent">
                    {item.subtitle}
                  </p>
                )}
              </div>
              <p className="text-body text-text-secondary md:col-span-5">{item.desc}</p>
              <div className="md:col-span-3">
                <p className="text-body-sm font-semibold text-text-primary">{item.time}</p>
                <p className="mt-1 text-caption text-text-muted">{item.loc}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
