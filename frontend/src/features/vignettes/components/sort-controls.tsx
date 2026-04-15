import { Select } from '@/components/ui/select'

export type SortMode = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'type'

interface SortControlsProps {
  value: SortMode
  onChange: (value: SortMode) => void
}

export function SortControls({ value, onChange }: SortControlsProps) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value as SortMode)}>
      <option value="date-desc">Newest First</option>
      <option value="date-asc">Oldest First</option>
      <option value="title-asc">Title A-Z</option>
      <option value="title-desc">Title Z-A</option>
      <option value="type">By Type</option>
    </Select>
  )
}
