import { useState, useMemo } from 'react'
import { BookOpen, Plus, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { FileViewer } from '@/components/shared/file-viewer'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { VignetteCard } from './components/vignette-card'
import { VignetteModal } from './components/vignette-modal'
import { SortControls, type SortMode } from './components/sort-controls'
import { useVignettes, useDeleteVignette, usePatchVignette } from './hooks/use-vignettes'
import { useVignetteFiles, useUploadVignetteFile, usePatchVignetteFile, useDeleteVignetteFile } from './hooks/use-vignette-files'
import { TagFilter } from '@/features/search/components/tag-filter'
import { useSearch } from '@/features/search/hooks/use-search'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { filesApi } from '@/lib/api/files'
import type { Vignette, FileItem } from '@/types/api'
import { FileCard } from '@/features/files/components/file-card'
import { useRef } from 'react'

type ListItem =
  | { type: 'vignette'; data: Vignette; date: string; sortKey: string }
  | { type: 'file'; data: FileItem; date: string; sortKey: string }

export function VignettesPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.is_admin ?? false

  const { data: vignettes, isLoading: loadingV } = useVignettes()
  const { data: files, isLoading: loadingF } = useVignetteFiles()
  const deleteVignette = useDeleteVignette()
  const patchVignette = usePatchVignette()
  const uploadFile = useUploadVignetteFile()
  const patchFile = usePatchVignetteFile()
  const deleteFile = useDeleteVignetteFile()

  const [sortBy, setSortBy] = useState<SortMode>('date-desc')
  const [filterTagIds, setFilterTagIds] = useState<number[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalVignette, setModalVignette] = useState<Vignette | null>(null)
  const [modalEditing, setModalEditing] = useState(false)
  const [deletingVignette, setDeletingVignette] = useState<Vignette | null>(null)
  const [deletingFile, setDeletingFile] = useState<FileItem | null>(null)
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tag filter: fetch matching IDs from search API
  const { data: tagResults } = useSearch('', undefined, filterTagIds.length > 0 ? filterTagIds : undefined)
  const tagAllowSet = useMemo(() => {
    if (filterTagIds.length > 0 && tagResults) {
      return new Set(tagResults.map((r) => `${r.content_type}-${r.content_id}`))
    }
    return null
  }, [filterTagIds, tagResults])

  const isLoading = loadingV || loadingF

  const sortedItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [
      ...(vignettes || [])
        .filter((v) => !tagAllowSet || tagAllowSet.has(`vignette-${v.id}`))
        .map((v) => ({
          type: 'vignette' as const,
          data: v,
          date: v.created_at,
          sortKey: v.title.toLowerCase(),
        })),
      ...(files || [])
        .filter((f) => !tagAllowSet || tagAllowSet.has(`file-${f.id}`))
        .map((f) => ({
          type: 'file' as const,
          data: f,
          date: f.created_at,
          sortKey: (f.title || f.filename).toLowerCase(),
        })),
    ]

    switch (sortBy) {
      case 'date-desc': return items.sort((a, b) => b.date.localeCompare(a.date))
      case 'date-asc': return items.sort((a, b) => a.date.localeCompare(b.date))
      case 'title-asc': return items.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      case 'title-desc': return items.sort((a, b) => b.sortKey.localeCompare(a.sortKey))
      case 'type': return items.sort((a, b) => a.type.localeCompare(b.type))
    }
  }, [vignettes, files, sortBy, tagAllowSet])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || [])
    for (const file of fileList) {
      await uploadFile.mutateAsync(file)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDownload = async (file: FileItem) => {
    const blob = await filesApi.get(file.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.title || file.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const openCreate = () => { setModalVignette(null); setModalEditing(true); setModalOpen(true) }
  const openView = (v: Vignette) => { setModalVignette(v); setModalEditing(false); setModalOpen(true) }
  const openEdit = (v: Vignette) => { setModalVignette(v); setModalEditing(true); setModalOpen(true) }

  return (
    <div>
      <PageHeader
        title="Vignettes"
        description="Written stories and family memories"
        actions={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <SortControls value={sortBy} onChange={setSortBy} />
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Upload Files
              </Button>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New Vignette
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-4">
        <TagFilter selectedTagIds={filterTagIds} onChange={setFilterTagIds} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : sortedItems.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No vignettes yet"
          description={isAdmin ? "Create your first story or upload files." : "No stories have been shared yet."}
          action={isAdmin ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Vignette</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) =>
            item.type === 'vignette' ? (
              <VignetteCard
                key={`v-${item.data.id}`}
                vignette={item.data}
                onView={() => openView(item.data)}
                onEdit={() => openEdit(item.data)}
                onDelete={() => setDeletingVignette(item.data)}
                onUpdateDate={(date) => patchVignette.mutate({ id: item.data.id, fields: { created_at: date } })}
              />
            ) : (
              <FileCard
                key={`f-${item.data.id}`}
                file={item.data}
                onView={() => setViewingFile(item.data)}
                onDownload={() => handleDownload(item.data)}
                onUpdate={(title, description) => patchFile.mutate({ id: item.data.id, fields: { title, description } })}
                onDelete={() => setDeletingFile(item.data)}
              />
            )
          )}
        </div>
      )}

      <VignetteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        vignette={modalVignette}
        editing={modalEditing}
      />

      {viewingFile && (
        <FileViewer
          fileId={viewingFile.id}
          filename={viewingFile.filename}
          fileType={viewingFile.file_type}
          onClose={() => setViewingFile(null)}
          onDownload={isAdmin ? () => handleDownload(viewingFile) : undefined}
        />
      )}

      <ConfirmDialog
        open={!!deletingVignette}
        onOpenChange={() => setDeletingVignette(null)}
        title="Delete Vignette"
        description={`Delete "${deletingVignette?.title}"? This cannot be undone.`}
        confirmLabel="Delete" destructive
        onConfirm={() => { if (deletingVignette) deleteVignette.mutate(deletingVignette.id) }}
      />
      <ConfirmDialog
        open={!!deletingFile}
        onOpenChange={() => setDeletingFile(null)}
        title="Delete File"
        description={`Delete "${deletingFile?.title || deletingFile?.filename}"? This cannot be undone.`}
        confirmLabel="Delete" destructive
        onConfirm={() => { if (deletingFile) deleteFile.mutate(deletingFile.id) }}
      />
    </div>
  )
}

export default VignettesPage
