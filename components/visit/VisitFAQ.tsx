'use client'
import Accordion from '@/components/ui/Accordion'
import Section from '@/components/layout/Section'
import SectionHeading from '@/components/layout/SectionHeading'
import Reveal from '@/components/ui/Reveal'

const faqs = [
  {
    q: 'Do I need to dress up?',
    a: 'Not at all. Amazing Grace Ministries is a come-as-you-are, non-denominational community. Whether you show up in a suit or jeans and sneakers, you are equally welcome here.',
  },
  {
    q: 'Can I join the service remotely?',
    a: 'Absolutely. Our Sunday services are available online via livestream. Bible Study on Mondays and our Wednesday Midweek service are accessible by audio conference — call 470-480-9523 or 425-436-6364 and enter Access Code 198407.',
  },
  {
    q: 'What is Open Heavens?',
    a: "Open Heavens is our monthly corporate prayer gathering held on the first Saturday of every month. It's a powerful time to start the month with prayer and set your mind in tune with God. All are welcome.",
  },
  {
    q: 'What is the Hour of Battle?',
    a: "Hour of Battle is our Wednesday midweek prayer service. We gather weekly to pray fervently together. It's a key part of our spiritual rhythm as a church family.",
  },
  {
    q: 'What about my kids?',
    a: "We love kids! We offer a safe, engaging children's program for ages infant through 5th grade during the Sunday morning service.",
  },
  {
    q: 'How long is the Sunday service?',
    a: 'Our Sunday services typically run about 90 minutes — including worship, announcements, and the message from Pastor Uchegbu.',
  },
  {
    q: 'Do I have to give money?',
    a: 'Absolutely not. Offering is a personal act of worship for members of our church family. As a guest, please feel no obligation whatsoever.',
  },
  {
    q: 'How do I get connected?',
    a: 'After service, look for our welcome team. You can also reach out through our Contact page and our team will provide you with a warm welcome and answer any questions you may have.',
  },
]

/** FAQ — every Q&A verbatim, on the shared Accordion primitive. */
export default function VisitFAQ() {
  return (
    <Section rhythm="normal">
      <Reveal>
        <SectionHeading eyebrow="Got Questions?" title="We Have Answers" />
      </Reveal>
      <Reveal delay={1} className="mt-12 max-w-3xl">
        <Accordion
          items={faqs.map((faq) => ({ title: faq.q, content: <p>{faq.a}</p> }))}
        />
      </Reveal>
    </Section>
  )
}
