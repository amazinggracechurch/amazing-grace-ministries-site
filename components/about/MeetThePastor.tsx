import Image from 'next/image'
import Section from '@/components/layout/Section'
import SectionHeading from '@/components/layout/SectionHeading'
import SplitSection from '@/components/layout/SplitSection'
import Reveal from '@/components/ui/Reveal'

const pastors = [
  {
    role: 'Senior Pastor & Founder',
    name: 'Pastor Nnaemeka Uchegbu',
    quote: 'Spreading hope, love, and the teachings of Christ \u2014 one life at a time.',
    bio: [
      'Pastor Nnaemeka Uchegbu is the Founder and spiritual leader of Amazing Grace Ministries MN \u2014 the driving force behind everything the church does. He loves to keep his hands full by participating in the development of sermons, outreach programs, and community engagement strategies.',
      'Pastor Uchegbu has built a reputation for inspiring and transforming lives through his powerful sermons and compassionate leadership. Under his guidance, Amazing Grace Ministries has grown into a thriving congregation, dedicated to spreading hope, love, and the teachings of Christ.',
    ],
    src: '/images/pastor-nnaemeka.jpg',
    alt: 'Portrait of Pastor Nnaemeka Uchegbu',
  },
  {
    role: 'Pastor',
    name: 'Pastor Nuhu Musa',
    quote: 'The message of grace and hope resonates with all who have the privilege of hearing it.',
    bio: [
      'Pastor Nuhu Musa is a vibrant and charismatic leader known for his dynamic approach to ministry. With a deep passion for guiding his congregation, Pastor Musa infuses his sermons with energy and inspiration, fostering a strong sense of community and spiritual growth.',
      'His engaging personality and unwavering commitment to his faith make him a beloved figure within the church. Pastor Musa\u2019s dedication to spreading the message of grace and hope resonates deeply with all who have the privilege of hearing him speak.',
    ],
    src: '/images/pastor-nuhu.jpg',
    alt: 'Portrait of Pastor Nuhu Musa',
  },
]

/**
 * Meet Our Pastors — magazine-style profiles: large portrait, name in
 * display serif, role as eyebrow, bio at a readable measure. The split
 * flips per pastor. Copy preserved verbatim from the original MeetThePastor.
 */
export default function MeetThePastor() {
  return (
    <Section rhythm="loose" sunken>
      <Reveal>
        <SectionHeading eyebrow="Leadership" title="Meet Our Pastors" />
      </Reveal>

      <div className="mt-16 space-y-24 md:mt-20 md:space-y-32">
        {pastors.map((pastor, i) => (
          <SplitSection
            key={pastor.name}
            flip={i % 2 === 1}
            main={
              <Reveal>
                <p className="eyebrow text-accent">{pastor.role}</p>
                <h3 className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary">
                  {pastor.name}
                </h3>
                <p className="mt-6 font-display text-heading italic text-accent">
                  &ldquo;{pastor.quote}&rdquo;
                </p>
                <div className="mt-6 max-w-xl space-y-5 text-body text-text-secondary">
                  {pastor.bio.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))}
                </div>
              </Reveal>
            }
            aside={
              <Reveal delay={1}>
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={pastor.src}
                    alt={pastor.alt}
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover object-top"
                  />
                </div>
              </Reveal>
            }
          />
        ))}
      </div>
    </Section>
  )
}
