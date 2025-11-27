import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import AuthenticatedAudio from '../components/AuthenticatedAudio'
import './AudioRecordings.css'

function AudioRecordings() {
  const { user } = useAuth()
  const [recordings, setRecordings] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [currentPlaying, setCurrentPlaying] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)

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
      // Check if MediaRecorder is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.')
        return
      }

      console.log('Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      console.log('Microphone access granted')
      streamRef.current = stream

      // Set up audio level monitoring
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyserRef.current = analyser
      const microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(analyser)
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / bufferLength
        const normalizedLevel = Math.min(100, (average / 255) * 100)
        setAudioLevel(normalizedLevel)
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
      }
      updateAudioLevel()

      // Try different mime types for better compatibility
      let mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else {
          mimeType = '' // Use browser default
        }
      }

      console.log('Using mime type:', mimeType || 'browser default')
      const options = mimeType ? { mimeType } : {}

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder

      const chunks = []
      mediaRecorder.ondataavailable = (e) => {
        console.log('Data available:', e.data.size, 'bytes')
        if (e.data && e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, chunks:', chunks.length)
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' })
          console.log('Recording stopped, blob created:', {
            size: blob.size,
            type: blob.type,
            chunks: chunks.length
          })

          if (blob.size > 0) {
            setAudioBlob(blob)
          } else {
            console.warn('Blob is empty')
            alert('Recording appears to be empty. Please try speaking into your microphone and try again.')
          }
        } else {
          console.warn('No audio chunks recorded')
          alert('No audio was recorded. Please ensure your microphone is working and try again.')
        }
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e)
        alert('An error occurred during recording. Please try again.')
      }

      mediaRecorder.onstart = () => {
        console.log('Recording started successfully')
      }

      // Start recording with timeslice to ensure data is available
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingTime(0)

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Microphone permission denied. Please allow microphone access in your browser settings and try again.')
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.')
      } else {
        alert(`Failed to access microphone: ${error.message || 'Unknown error'}. Please check your browser settings.`)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Request final data before stopping
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.requestData()
      }
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setAudioLevel(0)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }

  const handleUploadRecording = async () => {
    if (!audioBlob) {
      console.error('No audio blob to upload')
      return
    }

    const formData = new FormData()
    formData.append('file', audioBlob, `recording-${Date.now()}.webm`)
    formData.append('title', `Recording ${format(new Date(), 'MMM d, yyyy HH:mm')}`)

    try {
      console.log('Uploading recording...', { blobSize: audioBlob.size, blobType: audioBlob.type })
      
      const response = await axios.post('/api/audio', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data' 
        },
      })

      console.log('Recording uploaded successfully:', response.data)

      // Clear the audio blob
      setAudioBlob(null)

      // Force audio elements to reload by incrementing refresh key
      setRefreshKey(prev => prev + 1)

      // Small delay to ensure file is ready on server
      await new Promise(resolve => setTimeout(resolve, 500))

      // Refresh the recordings list
      await fetchRecordings()
      
      // Show success message
      alert('Recording saved successfully!')
    } catch (error) {
      console.error('Failed to upload recording:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      alert(`Failed to upload recording: ${error.response?.data?.detail || error.message || 'Unknown error'}`)
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

  const handleEdit = (recording) => {
    setEditingId(recording.id)
    setEditTitle(recording.title || '')
    setEditDescription(recording.description || '')
  }

  const handleSaveEdit = async () => {
    try {
      const formData = new FormData()
      formData.append('title', editTitle)
      formData.append('description', editDescription)

      await axios.put(`/api/audio/${editingId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setEditingId(null)
      setEditTitle('')
      setEditDescription('')
      fetchRecordings()
    } catch (error) {
      console.error('Failed to update recording:', error)
      alert('Failed to update recording')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
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

      <div className="container" style={{ maxWidth: '400px', margin: '0 0 3rem 0' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Record New Audio</h2>
        <div className="recording-controls">
          {!isRecording && !audioBlob && (
            <button onClick={startRecording} className="btn btn-primary">
              Start Recording
            </button>
          )}
          
          {isRecording && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                width: '100%',
                flexWrap: 'wrap'
              }}>
                <div className="recording-indicator" style={{ flex: '0 0 auto' }}>
                  <span className="recording-dot"></span>
                  Recording: {formatTime(recordingTime)}
                </div>
                <div style={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                  }}>
                    <span>Audio Level</span>
                    <span>{Math.round(audioLevel)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '40px',
                    backgroundColor: 'var(--surface)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid var(--border)',
                    position: 'relative'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${audioLevel}%`,
                      backgroundColor: audioLevel > 70 ? '#4CAF50' : audioLevel > 30 ? '#FFC107' : '#FF9800',
                      transition: 'width 0.1s ease-out, background-color 0.3s',
                      boxShadow: audioLevel > 5 ? `0 0 10px ${audioLevel > 70 ? '#4CAF50' : audioLevel > 30 ? '#FFC107' : '#FF9800'}` : 'none'
                    }}></div>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: audioLevel > 50 ? 'white' : 'var(--text-primary)',
                      textShadow: audioLevel > 50 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                      pointerEvents: 'none',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                    }}>
                      {audioLevel < 5 ? 'Speak into microphone...' : 'Recording...'}
                    </div>
                  </div>
                </div>
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
                <button 
                  onClick={handleUploadRecording} 
                  className="btn btn-primary"
                  disabled={!audioBlob || audioBlob.size === 0}
                >
                  Save Recording
                </button>
                <button 
                  onClick={() => {
                    setAudioBlob(null)
                    setRecordingTime(0)
                  }} 
                  className="btn btn-secondary"
                >
                  Discard
                </button>
              </div>
              {audioBlob && (
                <p style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.85rem', 
                  color: 'var(--text-muted)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                }}>
                  Size: {(audioBlob.size / 1024).toFixed(2)} KB
                </p>
              )}
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
              <div key={recording.id} className="card" style={{ position: 'relative' }}>
                {editingId === recording.id ? (
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={handleSaveEdit} className="btn btn-primary">
                        Save
                      </button>
                      <button onClick={handleCancelEdit} className="btn btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 style={{ marginBottom: '0.75rem' }}>{recording.title || 'Untitled Recording'}</h3>
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
                    <AuthenticatedAudio
                      key={`audio-${recording.id}-${refreshKey}`}
                      audioId={recording.id}
                      onPlay={() => setCurrentPlaying(recording.id)}
                      onPause={() => setCurrentPlaying(null)}
                      style={{ width: '100%', marginTop: '1rem', marginBottom: '2.5rem' }}
                      preload="metadata"
                    />
                    {user?.is_admin && (
                      <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(recording)}
                          className="btn btn-secondary"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.7rem'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(recording.id)}
                          className="btn btn-danger"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.7rem'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AudioRecordings
