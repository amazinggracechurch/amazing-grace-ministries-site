import Image from 'next/image'
import Section from '@/components/layout/Section'
import SplitSection from '@/components/layout/SplitSection'
import Reveal from '@/components/ui/Reveal'

/**
 * Our Story — 7/5 asymmetric split, text main with a portrait photograph
 * aside and the Matthew 18:20 scripture as a styled blockquote.
 * Copy preserved verbatim from the original OurStory.
 */
export default function OurStory() {
  return (
    <Section rhythm="loose">
      <SplitSection
        main={
          <Reveal>
            <p className="eyebrow text-accent">Our Story</p>
            <h2 className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary">
              More Than a Church.
            </h2>
            <p className="mt-2 font-display text-heading italic text-accent">
              A Family on Mission.
            </p>
            <div className="mt-8 max-w-xl space-y-5 text-body text-text-secondary">
              <p>
                Welcome to Amazing Grace Ministries! We are delighted to have you join our
                vibrant and loving community, led by our charismatic Senior Pastor, Nnaemeka Uchegbu.
              </p>
              <p>
                At Amazing Grace, we are committed to spreading hope, love, and the teachings of
                Christ. We provide a warm and nurturing environment where you can grow spiritually
                through engaging sermons, interactive Bible studies, and meaningful fellowship.
              </p>
              <p>
                Our diverse, non-denominational community is dedicated to supporting one another on
                the journey of faith, offering various opportunities for personal development and
                spiritual renewal. We look forward to welcoming you with open arms as we journey
                together towards a closer walk with God.
              </p>
            </div>
            <blockquote className="mt-10 border-l-2 border-accent pl-6">
              <p className="font-display text-heading italic text-text-primary">
                &ldquo;For where two or three gather in my name, there am I with them.&rdquo;
              </p>
              <cite className="mt-3 block text-body-sm font-semibold not-italic text-accent">
                &mdash; Matthew 18:20
              </cite>
            </blockquote>
          </Reveal>
        }
        aside={
          <Reveal delay={1}>
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/images/worship-keys.jpg"
                alt="Hands playing the keyboard during worship at Amazing Grace Ministries"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover transition-transform duration-500 hover:scale-[1.03]"
              />
            </div>
          </Reveal>
        }
      />
    </Section>
  )
}
