import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import './AudioRecordings.css'

function AudioRecordings() {
  const [recordings, setRecordings] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [currentPlaying, setCurrentPlaying] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    fetchRecordings()
  }, [])

  const fetchRecordings = async () => {
    try {
      const response = await axios.get('/api/audio')
      setRecordings(response.data)
    } catch (error) {
      console.error('Failed to fetch recordings:', error)
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const handleUploadRecording = async () => {
    if (!audioBlob) return

    const formData = new FormData()
    formData.append('file', audioBlob, `recording-${Date.now()}.webm`)
    formData.append('title', `Recording ${format(new Date(), 'MMM d, yyyy HH:mm')}`)

    try {
      await axios.post('/api/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Clean up blob URL
      if (audioBlob) {
        URL.revokeObjectURL(URL.createObjectURL(audioBlob))
      }

      setAudioBlob(null)

      // Force audio elements to reload by incrementing refresh key
      setRefreshKey(prev => prev + 1)

      // Small delay to ensure file is ready on server
      await new Promise(resolve => setTimeout(resolve, 800))

      fetchRecordings()
    } catch (error) {
      console.error('Failed to upload recording:', error)
      alert('Failed to upload recording')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name)

    try {
      await axios.post('/api/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Force audio elements to reload
      setRefreshKey(prev => prev + 1)

      // Small delay to ensure file is ready
      await new Promise(resolve => setTimeout(resolve, 800))

      fetchRecordings()
    } catch (error) {
      console.error('Failed to upload audio:', error)
      alert('Failed to upload audio file')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recording? This cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`/api/audio/${id}`)
      fetchRecordings()
    } catch (error) {
      console.error('Failed to delete recording:', error)
      alert('Failed to delete recording')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Voice Recordings</h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            marginTop: '-1rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
          }}>
            Capture your voice and stories for future generations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            + Upload Audio
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="container">
        <h2 style={{ marginBottom: '1.5rem' }}>Record New Audio</h2>
        <div className="recording-controls">
          {!isRecording && !audioBlob && (
            <button onClick={startRecording} className="btn btn-primary">
              Start Recording
            </button>
          )}
          
          {isRecording && (
            <>
              <div className="recording-indicator">
                <span className="recording-dot"></span>
                Recording: {formatTime(recordingTime)}
              </div>
              <button onClick={stopRecording} className="btn btn-danger">
                Stop Recording
              </button>
            </>
          )}
          
          {audioBlob && !isRecording && (
            <div className="recording-preview">
              <audio controls src={URL.createObjectURL(audioBlob)} />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={handleUploadRecording} className="btn btn-primary">
                  Save Recording
                </button>
                <button onClick={() => setAudioBlob(null)} className="btn btn-secondary">
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Your Recordings</h2>
        {recordings.length === 0 ? (
          <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{
              fontSize: '1.2rem',
              color: 'var(--text-secondary)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
            }}>
              No recordings yet. Record or upload your first audio to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-2">
            {recordings.map((recording) => (
              <div key={recording.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ marginBottom: 0, flex: 1 }}>{recording.title || 'Untitled Recording'}</h3>
                  <button
                    onClick={() => handleDelete(recording.id)}
                    className="btn btn-danger"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      marginLeft: '1rem'
                    }}
                  >
                    Delete
                  </button>
                </div>
                <p style={{
                  color: 'var(--text-muted)',
                  marginBottom: '1.25rem',
                  fontSize: '0.9rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                }}>
                  {format(new Date(recording.created_at), 'MMMM d, yyyy')}
                </p>
                {recording.description && (
                  <p style={{
                    marginBottom: '1rem',
                    color: 'var(--text-secondary)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                  }}>{recording.description}</p>
                )}
                <audio
                  key={`audio-${recording.id}-${refreshKey}`}
                  controls
                  src={`http://localhost:8000/api/audio/${recording.id}?v=${refreshKey}&t=${Date.now()}`}
                  onPlay={() => setCurrentPlaying(recording.id)}
                  onPause={() => setCurrentPlaying(null)}
                  style={{ width: '100%', marginTop: '1rem' }}
                  preload="metadata"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AudioRecordings

