import { TreePine } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-background py-6 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <TreePine className="h-4 w-4" />
            <span>Gladney Family Tree</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Gladney Family. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
