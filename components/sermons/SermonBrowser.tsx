'use client'
import { useState } from 'react'
import Section from '@/components/layout/Section'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Reveal from '@/components/ui/Reveal'

/**
 * The sermon library — live search plus series filters over a clean
 * editorial list. Every row links out to the YouTube channel until the
 * per-sermon data layer lands.
 */
const sermons = [
  {
    id: 1,
    title: 'The Promise Is Still Yes',
    series: 'Living in the Promise',
    pastor: 'Pastor Nnaemeka Uchegbu',
    date: 'May 12, 2025',
    duration: '42 min',
    scripture: 'Numbers 23:19',
    isLatest: true,
  },
  {
    id: 2,
    title: 'Walking by Faith, Not by Sight',
    series: 'Living in the Promise',
    pastor: 'Pastor Nnaemeka Uchegbu',
    date: 'May 5, 2025',
    duration: '38 min',
    scripture: '2 Corinthians 5:7',
    isLatest: false,
  },
  {
    id: 3,
    title: 'God\'s Timing Is Perfect',
    series: 'Living in the Promise',
    pastor: 'Pastor Nnaemeka Uchegbu',
    date: 'Apr 28, 2025',
    duration: '45 min',
    scripture: 'Ecclesiastes 3:11',
    isLatest: false,
  },
  {
    id: 4,
    title: 'Deep Roots, Strong Fruit',
    series: 'Rooted',
    pastor: 'Pastor Nnaemeka Uchegbu',
    date: 'Mar 16, 2025',
    duration: '40 min',
    scripture: 'Psalm 1:1-3',
    isLatest: false,
  },
  {
    id: 5,
    title: 'The Word That Does Not Return Void',
    series: 'Rooted',
    pastor: 'Pastor Nnaemeka Uchegbu',
    date: 'Mar 9, 2025',
    duration: '36 min',
    scripture: 'Isaiah 55:11',
    isLatest: false,
  },
  {
    id: 6,
    title: 'More Grace',
    series: 'Grace Upon Grace',
    pastor: 'Pastor Nnaemeka Uchegbu',
    date: 'Jan 26, 2025',
    duration: '44 min',
    scripture: 'James 4:6',
    isLatest: false,
  },
]

const categories = ['All', 'Living in the Promise', 'Rooted', 'Grace Upon Grace']

export default function SermonBrowser({ youtubeUrl }: { youtubeUrl: string }) {
  const [activeFilter, setActiveFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const filtered = sermons.filter((s) => {
    const matchesSeries = activeFilter === 'All' || s.series === activeFilter
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.scripture.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.series.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pastor.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSeries && matchesSearch
  })

  return (
    <Section rhythm="normal" id="browser">
      <Reveal>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Input
            label="Search"
            type="search"
            placeholder="Search sermons, scriptures, speakers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            wrapperClassName="w-full md:max-w-sm"
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by series">
            {categories.map((cat) => {
              const isActive = activeFilter === cat
              return (
                <Button
                  key={cat}
                  size="sm"
                  variant={isActive ? 'primary' : 'secondary'}
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(cat)}
                >
                  {cat}
                </Button>
              )
            })}
          </div>
        </div>
      </Reveal>

      {filtered.length > 0 ? (
        <ul className="mt-10 border-t border-border-subtle">
          {filtered.map((sermon) => (
            <li key={sermon.id}>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid grid-cols-1 gap-2 border-b border-border-subtle py-6 md:grid-cols-12 md:items-center md:gap-6"
              >
                <div className="md:col-span-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-heading text-text-primary transition-colors duration-200 group-hover:text-accent">
                      {sermon.title}
                    </h3>
                    {sermon.isLatest && <Badge variant="accent">Latest</Badge>}
                  </div>
                  <p className="mt-1 font-display text-body-sm italic text-accent">
                    {sermon.scripture}
                  </p>
                </div>
                <p className="text-body-sm text-text-secondary md:col-span-3">{sermon.pastor}</p>
                <p className="text-body-sm text-text-muted md:col-span-2">
                  {sermon.date} &middot; {sermon.duration}
                </p>
                <div className="md:col-span-2 md:text-right">
                  <Badge>{sermon.series}</Badge>
                </div>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mt-10"
          title="No sermons found."
          body="Try adjusting your search query or choosing another series filter."
        />
      )}
    </Section>
  )
}
