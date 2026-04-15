import { useRef } from 'react'
import { Upload, Trash2, ImageIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/shared/toast'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useBackground, useUploadBackground, useDeleteBackground } from '../hooks/use-admin'
import { useState } from 'react'

export function BackgroundManager() {
  const { toast } = useToast()
  const { data: bg } = useBackground()
  const uploadBg = useUploadBackground()
  const deleteBg = useDeleteBackground()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadBg.mutateAsync(file)
      toast('Background image uploaded! Refresh to see it.', 'success')
    } catch {
      toast('Failed to upload background', 'error')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Background Image</CardTitle>
      </CardHeader>
      <CardContent>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

        {bg ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {bg.url ? (
                <img src={bg.url} alt="Current background" className="h-20 w-32 object-cover rounded-lg border" />
              ) : (
                <div className="h-20 w-32 rounded-lg border bg-muted flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Background Active</p>
                <p className="text-xs text-muted-foreground">{bg.filename}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadBg.isPending}>
                <Upload className="h-3.5 w-3.5" /> {uploadBg.isPending ? 'Uploading...' : 'Replace'}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">No background image set.</p>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadBg.isPending}>
              <Upload className="h-3.5 w-3.5" /> {uploadBg.isPending ? 'Uploading...' : 'Upload Background'}
            </Button>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Remove Background"
        description="Remove the background image? Refresh the page to see the change."
        confirmLabel="Remove" destructive
        onConfirm={() => {
          if (bg) { deleteBg.mutate(bg.id); toast('Background removed', 'success') }
        }}
      />
    </Card>
  )
}
