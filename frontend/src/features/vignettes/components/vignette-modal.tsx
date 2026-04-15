import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Save } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AuthenticatedImage } from '@/components/shared/authenticated-image'
import { formatDate } from '@/lib/utils/date'
import { photosApi } from '@/lib/api/photos'
import { TagInput } from '@/features/search/components/tag-input'
import { useCreateVignette, useUpdateVignette } from '../hooks/use-vignettes'
import type { Vignette, Photo } from '@/types/api'

interface VignetteModalProps {
  open: boolean
  onClose: () => void
  vignette?: Vignette | null
  editing: boolean
}

export function VignetteModal({ open, onClose, vignette, editing }: VignetteModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([])
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([])
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const createVignette = useCreateVignette()
  const updateVignette = useUpdateVignette()
  const saving = createVignette.isPending || updateVignette.isPending

  useEffect(() => {
    if (open && editing) {
      photosApi.list().then(setAvailablePhotos).catch(() => {})
    }
  }, [open, editing])

  useEffect(() => {
    if (vignette) {
      setTitle(vignette.title)
      setContent(vignette.content || '')
      setSelectedPhotos(vignette.photos?.map((p) => p.id) || [])
    } else {
      setTitle('')
      setContent('')
      setSelectedPhotos([])
    }
    setError('')
  }, [vignette, open])

  const togglePhoto = (photoId: number) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    )
  }

  const startDictation = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          setContent((prev: string) => prev + event.results[i][0].transcript)
        }
      }
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  const stopDictation = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setError('')
    try {
      if (vignette) {
        await updateVignette.mutateAsync({
          id: vignette.id,
          data: { title, content },
        })
      } else {
        await createVignette.mutateAsync({ title, content, photo_ids: selectedPhotos })
      }
      stopDictation()
      onClose()
    } catch {
      setError('Failed to save vignette')
    }
  }

  // View mode
  if (!editing && vignette) {
    return (
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{vignette.title}</DialogTitle>
            <p className="text-sm text-muted-foreground">{formatDate(vignette.created_at)}</p>
          </DialogHeader>
          {vignette.content && (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{vignette.content}</div>
          )}
          {vignette.photos.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Attached Photos</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {vignette.photos.map((photo) => (
                  <AuthenticatedImage
                    key={photo.id}
                    photoId={photo.id}
                    alt={photo.title || 'Photo'}
                    className="w-full aspect-square object-cover rounded-md"
                  />
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  // Edit/Create mode
  return (
    <Dialog open={open} onOpenChange={() => { stopDictation(); onClose() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{vignette ? 'Edit Vignette' : 'Create New Vignette'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vignette-title">Title</Label>
            <Input
              id="vignette-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your story a title"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vignette-content">Content</Label>
              <Button
                type="button"
                variant={isListening ? 'destructive' : 'outline'}
                size="sm"
                onClick={isListening ? stopDictation : startDictation}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                {isListening ? 'Stop Dictation' : 'Dictate'}
              </Button>
            </div>
            {isListening && (
              <div className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Recording... Speak now
              </div>
            )}
            <Textarea
              id="vignette-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your story..."
              rows={8}
            />
          </div>

          {vignette && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagInput contentType="vignette" contentId={vignette.id} />
            </div>
          )}

          {availablePhotos.length > 0 && (
            <div className="space-y-2">
              <Label>Attach Photos</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                {availablePhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => togglePhoto(photo.id)}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      selectedPhotos.includes(photo.id)
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <AuthenticatedImage
                      photoId={photo.id}
                      alt={photo.title || 'Photo'}
                      className="w-full h-full object-cover"
                    />
                    {selectedPhotos.includes(photo.id) && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                          <Save className="h-3 w-3" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { stopDictation(); onClose() }}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : vignette ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
