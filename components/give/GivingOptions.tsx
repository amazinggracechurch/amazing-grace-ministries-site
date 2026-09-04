import Section from '@/components/layout/Section'
import SectionHeading from '@/components/layout/SectionHeading'
import Reveal from '@/components/ui/Reveal'

const options = [
  {
    title: 'In Person',
    body: 'Drop your offering in the basket during any Sunday or Wednesday service. Every gift is received with gratitude.',
  },
  {
    title: 'By Mail',
    body: 'Send a check made payable to "Amazing Grace Ministries MN" to our church address. Include your name and fund designation.',
  },
  {
    title: 'Bank Transfer',
    body: 'Set up a direct bank transfer or ACH payment. Contact our finance team for account details and setup instructions.',
  },
  {
    title: 'Planned Giving',
    body: 'Consider including Amazing Grace in your estate planning. Contact us to learn about legacy giving opportunities.',
  },
]

/**
 * Ways to give — a clean typographic list. The words carry the section;
 * no icon cards. Copy preserved verbatim from the original GivingOptions.
 */
export default function GivingOptions() {
  return (
    <Section rhythm="normal">
      <Reveal>
        <SectionHeading
          eyebrow="Other Ways to Give"
          title="More Giving Options"
        />
      </Reveal>

      <dl className="mt-14 grid grid-cols-1 border-t border-border-subtle sm:grid-cols-2 lg:grid-cols-4">
        {options.map((option, i) => (
          <Reveal
            key={option.title}
            delay={Math.min(i, 4) as 0 | 1 | 2 | 3 | 4}
            className="border-b border-border-subtle py-8 sm:px-6 sm:first:pl-0 sm:last:pr-0"
          >
            <dt className="eyebrow text-accent">{option.title}</dt>
            <dd className="mt-4 max-w-xs text-body text-text-secondary">{option.body}</dd>
          </Reveal>
        ))}
      </dl>
    </Section>
  )
}
