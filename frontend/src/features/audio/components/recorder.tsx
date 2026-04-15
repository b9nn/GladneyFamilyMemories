import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUploadRecording } from '../hooks/use-recordings'
import { format } from 'date-fns'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function Recorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const uploadRecording = useUploadRecording()

  const startAudioLevelUpdates = () => {
    const tick = () => {
      if (!analyserRef.current) return
      const data = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      setAudioLevel(Math.min(100, (avg / 128) * 100))
      animationFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Audio recording is not supported in this browser')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      })
      streamRef.current = stream

      // Audio level monitoring
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioContextRef.current = ctx
      analyserRef.current = analyser
      startAudioLevelUpdates()

      // MIME type detection
      const mimeTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', '']
      const mimeType = mimeTypes.find((t) => !t || MediaRecorder.isTypeSupported(t)) || ''

      const chunks: Blob[] = []
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' })
        if (blob.size > 0) setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.onerror = () => setIsRecording(false)

      recorder.start(100)
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingTime(0)
      intervalRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    } catch {
      alert('Could not access microphone')
    }
  }

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    audioContextRef.current?.close()
    setIsRecording(false)
    setAudioLevel(0)
  }, [])

  const saveRecording = async () => {
    if (!audioBlob) return
    const title = `Recording ${format(new Date(), 'MMM d, yyyy h:mm a')}`
    await uploadRecording.mutateAsync({ file: audioBlob, title })
    setAudioBlob(null)
    setRecordingTime(0)
  }

  const discardRecording = () => {
    setAudioBlob(null)
    setRecordingTime(0)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
      audioContextRef.current?.close()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // Idle state
  if (!isRecording && !audioBlob) {
    return (
      <Button onClick={startRecording} size="lg">
        <Mic className="h-4 w-4" />
        Start Recording
      </Button>
    )
  }

  // Recording state
  if (isRecording) {
    return (
      <Card className="border-red-200 dark:border-red-900">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="inline-block h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-lg font-bold">{formatTime(recordingTime)}</span>
            <span className="text-sm text-muted-foreground">Recording...</span>
          </div>

          {/* Audio level bar */}
          <div className="relative h-6 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${audioLevel}%`,
                background: audioLevel < 30 ? '#f97316' : audioLevel < 70 ? '#eab308' : '#22c55e',
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
              {audioLevel < 10 ? 'Speak into microphone...' : `${Math.round(audioLevel)}%`}
            </span>
          </div>

          <Button variant="destructive" onClick={stopRecording}>
            <Square className="h-4 w-4" />
            Stop Recording
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Preview state
  if (audioBlob) {
    const previewUrl = URL.createObjectURL(audioBlob)
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Recording preview ({(audioBlob.size / 1024).toFixed(0)} KB)
          </p>
          <audio src={previewUrl} controls className="w-full" />
          <div className="flex gap-2">
            <Button onClick={saveRecording} disabled={uploadRecording.isPending}>
              <Save className="h-4 w-4" />
              {uploadRecording.isPending ? 'Saving...' : 'Save Recording'}
            </Button>
            <Button variant="outline" onClick={discardRecording}>
              <Trash2 className="h-4 w-4" />
              Discard
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
