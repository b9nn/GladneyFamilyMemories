import { useState, useMemo } from 'react'
import { Clock } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { FilterBar } from './components/filter-bar'
import { TimelineEventCard } from './components/timeline-event-card'
import { YearMarker } from './components/year-marker'
import { useTimeline } from './hooks/use-timeline'
import { defaultFilters, type TimelineFilters } from './types'

export function TimelinePage() {
  const [filters, setFilters] = useState<TimelineFilters>(defaultFilters)
  const { events, isLoading } = useTimeline(filters)

  // Group events by year for year markers
  const grouped = useMemo(() => {
    const result: { year: number; events: typeof events }[] = []
    let currentYear: number | null = null

    for (const event of events) {
      const year = new Date(event.date).getFullYear()
      if (year !== currentYear) {
        currentYear = year
        result.push({ year, events: [] })
      }
      result[result.length - 1].events.push(event)
    }
    return result
  }, [events])

  return (
    <div>
      <PageHeader title="Timeline" description="Chronological view of family memories" />

      <div className="mb-6">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No events"
          description="No memories match your current filters. Try adjusting or clearing them."
        />
      ) : (
        <div className="space-y-2">
          {grouped.map((group) => (
            <div key={group.year}>
              <YearMarker year={group.year} />
              <div className="space-y-2">
                {group.events.map((event) => (
                  <TimelineEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TimelinePage
