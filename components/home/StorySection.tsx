import Image from 'next/image'
import Section from '@/components/layout/Section'
import SplitSection from '@/components/layout/SplitSection'
import Reveal from '@/components/ui/Reveal'

/**
 * Welcome / story — 7/5 asymmetric split with a portrait photograph.
 * Copy preserved verbatim from the original AboutSection.
 */
export default function StorySection() {
  return (
    <Section rhythm="loose">
      <SplitSection
        main={
          <Reveal>
            <p className="eyebrow text-accent">Who We Are</p>
            <h2 className="mt-4 max-w-lg font-display text-display-md font-medium tracking-display text-text-primary">
              A vibrant and loving community in Saint Paul
            </h2>
            <div className="mt-8 max-w-xl space-y-5 text-body text-text-secondary">
              <p>
                Welcome to <strong className="font-semibold text-text-primary">Amazing Grace Ministries</strong>!
                We are delighted to have you join our vibrant and loving community, led by our
                charismatic Senior Pastor, <strong className="font-semibold text-text-primary">Nnaemeka Uchegbu</strong>.
              </p>
              <p>
                At Amazing Grace, we are committed to spreading hope, love, and the teachings of
                Christ. We provide a warm and nurturing environment where you can grow spiritually
                through engaging sermons, interactive Bible studies, and meaningful fellowship.
              </p>
              <p>
                Our diverse, non-denominational community is dedicated to supporting one another on
                the journey of faith, offering various opportunities for personal development and
                spiritual renewal.
              </p>
            </div>
            <p className="mt-8 font-display text-heading italic text-accent">
              &ldquo;You belong here.&rdquo;
            </p>
          </Reveal>
        }
        aside={
          <Reveal delay={1}>
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/images/img2.jpg"
                alt="The worship team of Amazing Grace Ministries leading the congregation in song"
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
