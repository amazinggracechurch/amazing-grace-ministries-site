import Section from '@/components/layout/Section'
import SectionHeading from '@/components/layout/SectionHeading'
import Accordion from '@/components/ui/Accordion'
import Reveal from '@/components/ui/Reveal'

const faqs = [
  {
    q: 'Is my gift tax-deductible?',
    a: 'Yes. Amazing Grace Ministries MN is a registered 501(c)(3) nonprofit organization. All donations are tax-deductible to the extent permitted by law. You will receive a giving statement for your records.',
  },
  {
    q: 'How is my donation used?',
    a: "Your gift goes directly to support our church's ministry operations — including Sunday services, outreach programs, youth ministry, and community care. We are committed to financial transparency and good stewardship.",
  },
  {
    q: 'Is online giving secure?',
    a: 'Absolutely. Our online giving platform uses industry-standard SSL encryption and is processed through a trusted, PCI-compliant payment provider. Your financial information is never stored on our servers.',
  },
  {
    q: 'Can I set up recurring giving?',
    a: "Yes. You can set up weekly, bi-weekly, or monthly recurring donations through our online giving form. Recurring giving is one of the most powerful ways to consistently support the church's mission.",
  },
  {
    q: 'Can I give to a specific fund?',
    a: 'Yes. When giving online, you can designate your gift to a specific fund — including our General Fund, Building Fund, Missions & Outreach, Youth Ministry, or Benevolence Fund.',
  },
  {
    q: 'What if I want to cancel my recurring gift?',
    a: "You can cancel or modify your recurring gift at any time by contacting our finance team at finance@amazinggracemn.org or by logging into your giving account. We'll take care of it promptly.",
  },
  {
    q: 'Do I need to create an account to give?',
    a: 'No account is required for one-time gifts. However, creating a free account allows you to track your giving history, download tax statements, and manage recurring donations easily.',
  },
]

/**
 * Giving questions — the shared Accordion primitive. Q&A copy preserved
 * verbatim from the original GiveFAQ (em-dash entities written as —).
 */
export default function GiveFAQ() {
  return (
    <Section rhythm="normal">
      <Reveal>
        <SectionHeading eyebrow="Giving Questions" title="Common Questions" />
      </Reveal>
      <Reveal delay={1}>
        <Accordion
          className="mt-12 max-w-3xl"
          items={faqs.map((faq) => ({ title: faq.q, content: <p>{faq.a}</p> }))}
        />
      </Reveal>
    </Section>
  )
}
