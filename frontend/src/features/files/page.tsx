import { useState } from 'react'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { FileViewer } from '@/components/shared/file-viewer'
import { Skeleton } from '@/components/ui/skeleton'
import { FileCard } from './components/file-card'
import { FileUploadButton } from './components/file-upload-button'
import { useFiles, useUpdateFile, useDeleteFile } from './hooks/use-files'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { filesApi } from '@/lib/api/files'
import type { FileItem } from '@/types/api'

export function FilesPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.is_admin ?? false
  const { data: files, isLoading } = useFiles('files')
  const updateFile = useUpdateFile()
  const deleteFile = useDeleteFile()

  const [viewingFile, setViewingFile] = useState<FileItem | null>(null)
  const [deletingFile, setDeletingFile] = useState<FileItem | null>(null)

  const handleDownload = async (file: FileItem) => {
    try {
      const blob = await filesApi.get(file.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.title || file.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // download failed
    }
  }

  return (
    <div>
      <PageHeader
        title="Files"
        description="Documents and file uploads"
        actions={isAdmin ? <FileUploadButton source="files" /> : undefined}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !files?.length ? (
        <EmptyState
          icon={FileText}
          title="No files yet"
          description={isAdmin ? "Upload some files to get started." : "No files have been uploaded yet."}
          action={isAdmin ? <FileUploadButton source="files" /> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onView={() => setViewingFile(file)}
              onDownload={() => handleDownload(file)}
              onUpdate={(title, description) =>
                updateFile.mutate({ id: file.id, updates: { title, description } })
              }
              onDelete={() => setDeletingFile(file)}
            />
          ))}
        </div>
      )}

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
        open={!!deletingFile}
        onOpenChange={() => setDeletingFile(null)}
        title="Delete File"
        description={`Are you sure you want to delete "${deletingFile?.title || deletingFile?.filename}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deletingFile) deleteFile.mutate(deletingFile.id)
        }}
      />
    </div>
  )
}

export default FilesPage
