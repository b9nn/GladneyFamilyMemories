import { useRef, useState } from 'react';
import { useUploadAudio } from '../hooks/useAudio';

interface AudioRecorderProps {
  onDone: () => void;
}

type RecorderState = 'idle' | 'recording' | 'stopped';

export function AudioRecorder({ onDone }: AudioRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [title, setTitle] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const upload = useUploadAudio();

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: 'audio/webm' });
        setBlob(b);
        setAudioUrl(URL.createObjectURL(b));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      startTimeRef.current = Date.now();
      setState('recording');
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch {
      setError('Could not access microphone. Please allow microphone access.');
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    setDuration(elapsed);
    mediaRef.current?.stop();
    setState('stopped');
  }

  function discard() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setBlob(null);
    setElapsed(0);
    setDuration(0);
    setState('idle');
  }

  async function handleUpload() {
    if (!blob) return;
    setUploading(true);
    setError('');
    try {
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
      await upload.mutateAsync({ file, title: title || undefined, durationSeconds: duration });
      discard();
      setTitle('');
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
      )}
      <div className="space-y-1">
        <label htmlFor="rec-title" className="text-sm font-medium text-foreground">Title (optional)</label>
        <input
          id="rec-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name this recording…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex items-center gap-4">
        {state === 'idle' && (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            <span className="w-3 h-3 rounded-full bg-white" />
            Record
          </button>
        )}
        {state === 'recording' && (
          <>
            <span className="flex items-center gap-2 text-red-500 font-medium text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {formatTime(elapsed)}
            </span>
            <button
              type="button"
              onClick={stopRecording}
              className="rounded-md bg-muted border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
            >
              Stop
            </button>
          </>
        )}
        {state === 'stopped' && audioUrl && (
          <div className="flex flex-col gap-3 w-full">
            <audio src={audioUrl} controls className="w-full" />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Save recording'}
              </button>
              <button
                type="button"
                onClick={discard}
                className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
