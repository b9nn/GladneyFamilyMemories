import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUploadFile } from '../hooks/use-files'

interface FileUploadButtonProps {
  source: string
}

export function FileUploadButton({ source }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadFile = useUploadFile()
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    try {
      await Promise.all(
        files.map((file) =>
          uploadFile.mutateAsync({ file, title: file.name, source })
        )
      )
    } catch {
      // Individual failures handled by mutation
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
        <Upload className="h-4 w-4" />
        {uploading ? 'Uploading...' : 'Upload Files'}
      </Button>
    </>
  )
}
