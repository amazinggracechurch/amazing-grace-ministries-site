import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

type FilterBarProps = {
  type?: string
  series?: string
  speaker?: string
  query?: string
  seriesOptions: string[]
  speakerOptions: string[]
}

/**
 * Server-driven filter bar: a plain GET form that round-trips through
 * searchParams, so every filtered view is a shareable URL and no client
 * state is involved. Applying filters always resets pagination (the
 * form carries no `page` input).
 */
export default function FilterBar({
  type,
  series,
  speaker,
  query,
  seriesOptions,
  speakerOptions,
}: FilterBarProps) {
  const hasFilters = Boolean(type || series || speaker || query)

  return (
    <form method="get" action="/blog" className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Type" name="type" defaultValue={type ?? ''}>
          <option value="">All types</option>
          <option value="sermon">Sermons</option>
          <option value="announcement">Announcements</option>
        </Select>
        <Select label="Series" name="series" defaultValue={series ?? ''}>
          <option value="">All series</option>
          {seriesOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select label="Speaker" name="speaker" defaultValue={speaker ?? ''}>
          <option value="">All speakers</option>
          {speakerOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Input
          label="Search"
          type="search"
          name="q"
          placeholder="Search titles & excerpts…"
          defaultValue={query ?? ''}
        />
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" variant="secondary" size="sm">
          Apply filters
        </Button>
        {hasFilters && (
          <Button href="/blog" variant="link" size="sm">
            Clear all
          </Button>
        )}
      </div>
    </form>
  )
}
