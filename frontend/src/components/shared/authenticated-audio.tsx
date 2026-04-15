import { useState, useEffect } from 'react'
import { audioApi } from '@/lib/api/audio'

interface AuthenticatedAudioProps extends React.AudioHTMLAttributes<HTMLAudioElement> {
  audioId: number
  onPlay?: () => void
  onPause?: () => void
}

export function AuthenticatedAudio({ audioId, onPlay, onPause, className, ...props }: AuthenticatedAudioProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let revoke: string | null = null

    const fetchAudio = async () => {
      try {
        setLoading(true)
        setError(false)
        const blob = await audioApi.get(audioId)
        const url = URL.createObjectURL(blob)
        revoke = url
        setAudioUrl(url)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchAudio()

    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [audioId])

  if (error) {
    return <div className="p-4 text-sm text-muted-foreground">Audio not available</div>
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading audio...</div>
  }

  return (
    <audio
      src={audioUrl!}
      controls
      onPlay={onPlay}
      onPause={onPause}
      preload="metadata"
      className={className}
      {...props}
    />
  )
}
