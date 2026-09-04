import Section from '@/components/layout/Section'
import SectionHeading from '@/components/layout/SectionHeading'
import Reveal from '@/components/ui/Reveal'

const beliefs = [
  {
    title: 'THE BIBLE',
    body: 'We believe the Bible is the inspired, infallible Word of God and the ultimate authority for faith and life.',
  },
  {
    title: 'THE TRINITY',
    body: 'We believe in one God eternally existing in three persons \u2014 Father, Son, and Holy Spirit \u2014 co-equal and co-eternal.',
  },
  {
    title: 'SALVATION',
    body: 'We believe salvation is by grace alone, through faith alone, in Christ alone. Every person can be saved through repentance and belief.',
  },
  {
    title: 'THE HOLY SPIRIT',
    body: 'We believe in the present-day ministry of the Holy Spirit, including the gifts of the Spirit for the building up of the church.',
  },
  {
    title: 'THE CHURCH',
    body: 'We believe the local church is God\u2019s primary vehicle for making disciples and transforming communities.',
  },
  {
    title: 'ETERNITY',
    body: 'We believe in the resurrection of the dead and the reality of eternal life \u2014 heaven for the redeemed, judgment for the unrepentant.',
  },
]

/**
 * Our Beliefs — a numbered editorial list with large Cormorant numerals,
 * not a card grid. Copy preserved verbatim from the original OurBeliefs.
 */
export default function OurBeliefs() {
  return (
    <Section rhythm="normal">
      <Reveal>
        <SectionHeading
          eyebrow="What We Stand On"
          title="What We Believe"
          lede="Our beliefs are rooted in the timeless truth of Scripture — the convictions that anchor everything we do as a community."
        />
      </Reveal>

      <ol className="mt-14 md:mt-16">
        {beliefs.map((belief, i) => (
          <li key={belief.title} className="border-t border-border-subtle last:border-b">
            <Reveal
              delay={Math.min(i, 4) as 0 | 1 | 2 | 3 | 4}
              className="grid grid-cols-[auto_1fr] items-baseline gap-6 py-8 md:gap-12 md:py-10"
            >
              <span
                aria-hidden
                className="w-14 font-display text-display-md font-light leading-none text-text-muted md:w-20"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-heading font-medium text-text-primary">
                  {belief.title}
                </h3>
                <p className="mt-2 max-w-2xl text-body text-text-secondary">{belief.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  )
}
