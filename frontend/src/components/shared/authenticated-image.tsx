import { useState, useEffect } from 'react'
import { photosApi } from '@/lib/api/photos'
import { cn } from '@/lib/utils'

interface AuthenticatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  photoId: number
}

export function AuthenticatedImage({ photoId, alt, className, ...props }: AuthenticatedImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let revoke: string | null = null

    const fetchImage = async () => {
      try {
        setLoading(true)
        setError(false)
        const blob = await photosApi.get(photoId)
        const url = URL.createObjectURL(blob)
        revoke = url
        setImageUrl(url)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchImage()

    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [photoId])

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground text-sm", className)}>
        Image not available
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center bg-muted animate-pulse", className)}>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  return (
    <img
      src={imageUrl!}
      alt={alt}
      className={className}
      {...props}
    />
  )
}
