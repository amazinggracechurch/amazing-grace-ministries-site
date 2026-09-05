'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'

/**
 * Picks a tax year and navigates to the statement download route. The route
 * streams a PDF with Content-Disposition: attachment, so a full navigation
 * (not fetch) is the right trigger.
 */
export default function StatementYearSelect({ years }: { years: number[] }) {
  const [year, setYear] = useState<number>(years[0] ?? new Date().getFullYear())

  return (
    <div className="flex flex-wrap items-end gap-4">
      <Select
        label="Statement year"
        wrapperClassName="w-40"
        value={year}
        onChange={(event) => setYear(Number(event.target.value))}
      >
        {years.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
      <Button
        variant="secondary"
        onClick={() => window.location.assign(`/account/giving/statement/${year}`)}
      >
        Download statement (PDF)
      </Button>
    </div>
  )
}
