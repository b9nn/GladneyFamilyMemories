interface YearMarkerProps {
  year: number
}

export function YearMarker({ year }: YearMarkerProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-sm font-bold text-muted-foreground">{year}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}
