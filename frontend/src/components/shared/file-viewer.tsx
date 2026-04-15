import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { filesApi } from '@/lib/api/files'

interface FileViewerProps {
  fileId: number
  filename: string
  fileType?: string | null
  onClose: () => void
  onDownload?: () => void
}

function getMediaType(filename: string, fileType?: string | null): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'unknown' {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const type = fileType?.toLowerCase() || ''

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || type.startsWith('image'))
    return 'image'
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext) || type.startsWith('video'))
    return 'video'
  if (['mp3', 'wav', 'ogg', 'webm', 'aac', 'm4a'].includes(ext) || type.startsWith('audio'))
    return 'audio'
  if (ext === 'pdf' || type === 'application/pdf')
    return 'pdf'
  if (['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(ext) || type.startsWith('text'))
    return 'text'
  return 'unknown'
}

export function FileViewer({ fileId, filename, fileType, onClose, onDownload }: FileViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const mediaType = getMediaType(filename, fileType)

  useEffect(() => {
    let url: string | null = null

    const fetch = async () => {
      try {
        const blob = await filesApi.get(fileId)
        url = URL.createObjectURL(blob)
        setBlobUrl(url)
      } catch {
        // Failed to load
      } finally {
        setLoading(false)
      }
    }

    fetch()

    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [fileId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {onDownload && (
          <Button variant="secondary" size="icon" onClick={(e) => { e.stopPropagation(); onDownload() }}>
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button variant="secondary" size="icon" onClick={(e) => { e.stopPropagation(); onClose() }}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="text-white text-sm">Loading...</div>
        ) : !blobUrl ? (
          <div className="text-white text-sm">Failed to load file</div>
        ) : mediaType === 'image' ? (
          <img src={blobUrl} alt={filename} className="max-w-full max-h-[85vh] object-contain rounded" />
        ) : mediaType === 'video' ? (
          <video src={blobUrl} controls className="max-w-full max-h-[85vh] rounded" />
        ) : mediaType === 'audio' ? (
          <div className="bg-background rounded-lg p-8 flex flex-col items-center gap-4">
            <p className="text-4xl">🎵</p>
            <p className="text-sm font-medium">{filename}</p>
            <audio src={blobUrl} controls />
          </div>
        ) : mediaType === 'pdf' || mediaType === 'text' ? (
          <iframe src={blobUrl} className="w-[80vw] h-[85vh] bg-white rounded" title={filename} />
        ) : (
          <div className="bg-background rounded-lg p-8 text-center space-y-4">
            <p className="text-muted-foreground">Cannot preview this file type</p>
            <p className="font-medium">{filename}</p>
            {onDownload && (
              <Button onClick={onDownload}>
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
