import { Wrench, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/shared/toast'
import { useMistaggedFiles, useFixFileSources } from '../hooks/use-admin'

export function FileTools() {
  const { toast } = useToast()
  const { data: mistagged } = useMistaggedFiles()
  const fixFiles = useFixFileSources()

  const count = mistagged?.mistagged_files ?? 0

  const handleFix = async () => {
    try {
      await fixFiles.mutateAsync()
      toast('Files reassigned successfully', 'success')
    } catch {
      toast('Failed to fix file sources', 'error')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" /> File Tools
        </CardTitle>
      </CardHeader>
      <CardContent>
        {count > 0 ? (
          <div className="space-y-3">
            <p className="text-sm">
              <strong>{count} file(s)</strong> are on the Vignettes page but should be on the Files page.
            </p>
            <Button size="sm" onClick={handleFix} disabled={fixFiles.isPending}>
              {fixFiles.isPending ? 'Moving...' : `Move ${count} File(s)`}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            All files are correctly assigned.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
