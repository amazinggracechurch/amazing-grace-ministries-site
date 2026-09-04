import Section from '@/components/layout/Section'
import SectionHeading from '@/components/layout/SectionHeading'
import Reveal from '@/components/ui/Reveal'

const steps = [
  {
    label: 'Arrival',
    title: 'Welcome & Greeting',
    body: 'Arrive 15–20 minutes early. Our welcome team will greet you at the door, help you find your seat, and answer any questions.',
  },
  {
    label: 'Worship',
    title: 'Spirit-Filled Worship',
    body: "We open with engaging, Spirit-filled worship led by our heavenly worship team, the Amazing Voices. Feel free to stand, sing along, or simply take it all in — there's no pressure.",
  },
  {
    label: 'Sunday School',
    title: 'Engaging Bible Teaching',
    body: 'Sunday School takes place during the main service. Our experienced teachers lead engaging and age-appropriate Bible lessons that will help your children grow in their faith.  designed to speak to real life. Messages typically run 35–45 minutes.',
  },
  {
    label: 'The Message',
    title: 'Powerful Bible Teaching',
    body: 'Pastor Nnaemeka Uchegbu delivers a relevant, scripture-based message designed to speak to real life. Messages typically run 35–45 minutes.',
  },
  {
    label: 'Children',
    title: 'Kids Are Welcome',
    body: "We have a safe, fun, and age-appropriate children's program running during the main service for ages infant through 5th grade.",
  },
  {
    label: 'Community',
    title: 'Connect After Service',
    body: 'Stay after the service for refreshments and conversation. Our team will be available to meet you and help you find your next step in the Amazing Family.',
  },
  {
    label: 'Atmosphere',
    title: 'Casual & Welcoming',
    body: "Come as you are — seriously. Jeans, t-shirts, whatever you're comfortable in. We are a come-as-you-are, non-denominational community.",
  },
]

/**
 * What to expect, as a plain-language editorial list — no icon cards.
 * The question (serif) sits left, the answer (body) sits right.
 */
export default function WhatToExpect() {
  return (
    <Section rhythm="loose">
      <Reveal>
        <SectionHeading
          eyebrow="First Time?"
          title="What to Expect"
          lede="We want your first visit to feel like coming home. Here's everything you need to know before you walk through the doors."
        />
      </Reveal>

      <div className="mt-14 border-t border-border-subtle">
        {steps.map((step, i) => (
          <Reveal
            key={step.title}
            delay={Math.min(i % 5, 4) as 0 | 1 | 2 | 3 | 4}
            className="grid grid-cols-1 gap-3 border-b border-border-subtle py-8 md:grid-cols-12 md:gap-10"
          >
            <div className="md:col-span-5">
              <p className="eyebrow text-text-muted">{step.label}</p>
              <h3 className="mt-2 font-display text-heading font-medium text-text-primary">
                {step.title}
              </h3>
            </div>
            <p className="max-w-xl text-body text-text-secondary md:col-span-7">
              {step.body}
            </p>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
