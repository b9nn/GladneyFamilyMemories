import React, { useState, useEffect } from 'react'
import axios from '../config/api'
import AuthenticatedImage from './AuthenticatedImage'
import './Modal.css'

function VignetteModal({ vignette, editing, onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [availablePhotos, setAvailablePhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)

  useEffect(() => {
    if (vignette) {
      setTitle(vignette.title || '')
      setContent(vignette.content || '')
      // Load already attached photos when editing
      if (vignette.photos && vignette.photos.length > 0) {
        setSelectedPhotos(vignette.photos.map(p => p.id))
      }
    }
    fetchPhotos()

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setContent(prev => prev + finalTranscript)
        }
      }

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [vignette])

  const fetchPhotos = async () => {
    try {
      const response = await axios.get('/api/photos')
      setAvailablePhotos(response.data)
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        title,
        content,
        photo_ids: selectedPhotos,
      }

      if (vignette) {
        await axios.put(`/api/vignettes/${vignette.id}`, data)
      } else {
        await axios.post('/api/vignettes', data)
      }

      onSave()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save vignette')
    } finally {
      setLoading(false)
    }
  }

  const togglePhoto = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    )
  }

  const toggleDictation = () => {
    if (!recognition) {
      setError('Voice dictation is not supported in your browser. Please use Chrome, Safari, or Edge.')
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  return (
    <div className="modal" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={!editing ? { maxWidth: '1200px', width: '90%' } : {}}
      >
        <div className="modal-header">
          <h2>{editing ? (vignette ? 'Edit Vignette' : 'Create Vignette') : vignette.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Content</span>
                <button
                  type="button"
                  onClick={toggleDictation}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: isListening ? '2px solid #dc3545' : '1px solid #6366f1',
                    backgroundColor: isListening ? '#ffe6e6' : 'white',
                    color: isListening ? '#dc3545' : '#6366f1',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  title={isListening ? 'Stop dictation' : 'Start dictation'}
                >
                  🎤 {isListening ? 'Stop Dictation' : 'Start Dictation'}
                </button>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your vignette here... or click 'Start Dictation' to speak"
                style={{
                  border: isListening ? '2px solid #dc3545' : '1px solid #ddd',
                  boxShadow: isListening ? '0 0 0 3px rgba(220, 53, 69, 0.1)' : 'none'
                }}
              />
              {isListening && (
                <p style={{
                  fontSize: '0.85rem',
                  color: '#dc3545',
                  marginTop: '0.5rem',
                  fontWeight: '500'
                }}>
                  🔴 Recording... Speak now
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Attach Photos to This Vignette</label>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.75rem', marginTop: '-0.5rem' }}>
                Click photos to select/deselect them for this vignette
              </p>
              <div className="photo-selection">
                {availablePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`photo-select-item ${selectedPhotos.includes(photo.id) ? 'selected' : ''}`}
                    onClick={() => togglePhoto(photo.id)}
                  >
                    <AuthenticatedImage
                      photoId={photo.id}
                      alt={photo.title || 'Photo'}
                    />
                    <input
                      type="checkbox"
                      checked={selectedPhotos.includes(photo.id)}
                      onChange={() => togglePhoto(photo.id)}
                      style={{ display: 'none' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              {new Date(vignette.created_at).toLocaleDateString()}
            </p>
            <div style={{ whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>
              {vignette.content || 'No content'}
            </div>

            {/* Show attached photos in view mode */}
            {vignette.photos && vignette.photos.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#333' }}>Attached Photos</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '1rem'
                }}>
                  {vignette.photos.map((photo) => (
                    <div key={photo.id} style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <AuthenticatedImage
                        photoId={photo.id}
                        alt={photo.title || 'Photo'}
                        style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                      />
                      {photo.title && (
                        <p style={{
                          padding: '0.5rem',
                          margin: 0,
                          fontSize: '0.85rem',
                          backgroundColor: '#f5f5f5',
                          textAlign: 'center'
                        }}>
                          {photo.title}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={onClose} className="btn btn-primary">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VignetteModal

