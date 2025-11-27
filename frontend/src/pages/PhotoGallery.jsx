import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import AuthenticatedImage from '../components/AuthenticatedImage'
import './PhotoGallery.css'

function PhotoGallery() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [albums, setAlbums] = useState([])
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'chronological'
  const [currentView, setCurrentView] = useState('photos') // 'photos' or 'albums'
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [albumPhotos, setAlbumPhotos] = useState([])
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumDescription, setNewAlbumDescription] = useState('')

  useEffect(() => {
    fetchPhotos()
    fetchAlbums()
  }, [])


  const fetchPhotos = async () => {
    try {
      const response = await axios.get('/api/photos')
      setPhotos(response.data)
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlbums = async () => {
    try {
      const response = await axios.get('/api/albums')
      setAlbums(response.data)
    } catch (error) {
      console.error('Failed to fetch albums:', error)
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name)

      try {
        await axios.post('/api/photos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } catch (error) {
        console.error('Failed to upload photo:', error)
      }
    }

    await fetchPhotos()
    setShowUpload(false)
  }

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`/api/photos/${photoId}`)
      await fetchPhotos()
      setSelectedPhoto(null)
    } catch (error) {
      console.error('Failed to delete photo:', error)
      alert('Failed to delete photo. Please try again.')
    }
  }

  const handleCreateAlbum = async (e) => {
    e.preventDefault()
    if (!newAlbumName.trim()) {
      alert('Please enter an album name')
      return
    }

    try {
      await axios.post('/api/albums', {
        name: newAlbumName,
        description: newAlbumDescription
      })
      setNewAlbumName('')
      setNewAlbumDescription('')
      setShowCreateAlbum(false)
      await fetchAlbums()
    } catch (error) {
      console.error('Failed to create album:', error)
      alert('Failed to create album. Please try again.')
    }
  }

  const handleViewAlbum = async (albumId) => {
    try {
      const response = await axios.get(`/api/albums/${albumId}`)
      setSelectedAlbum(response.data)
      setAlbumPhotos(response.data.photos || [])
    } catch (error) {
      console.error('Failed to fetch album:', error)
      alert('Failed to load album.')
    }
  }

  const handleDeleteAlbum = async (albumId) => {
    if (!window.confirm('Are you sure you want to delete this album? This will not delete the photos.')) {
      return
    }

    try {
      await axios.delete(`/api/albums/${albumId}`)
      await fetchAlbums()
      if (selectedAlbum?.id === albumId) {
        setSelectedAlbum(null)
        setAlbumPhotos([])
      }
    } catch (error) {
      console.error('Failed to delete album:', error)
      alert('Failed to delete album. Please try again.')
    }
  }

  const handleAddPhotoToAlbum = async (photoId, albumId) => {
    try {
      await axios.post(`/api/albums/${albumId}/photos/${photoId}`)
      alert('Photo added to album!')
      // Refresh album if viewing
      if (selectedAlbum?.id === albumId) {
        await handleViewAlbum(albumId)
      }
      await fetchAlbums()
    } catch (error) {
      console.error('Failed to add photo to album:', error)
      alert('Failed to add photo to album.')
    }
  }

  const handleRemovePhotoFromAlbum = async (photoId, albumId) => {
    if (!window.confirm('Remove this photo from the album?')) {
      return
    }

    try {
      await axios.delete(`/api/albums/${albumId}/photos/${photoId}`)
      // Refresh album view
      await handleViewAlbum(albumId)
      await fetchAlbums()
    } catch (error) {
      console.error('Failed to remove photo from album:', error)
      alert('Failed to remove photo.')
    }
  }

  const sortedPhotos = [...photos].sort((a, b) => {
    const dateA = new Date(a.created_at)
    const dateB = new Date(b.created_at)
    return dateB - dateA
  })

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Photo Gallery</h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            marginTop: '-1rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
          }}>
            A visual journey through your family memories
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {currentView === 'photos' && (
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '2px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="grid">Grid View</option>
              <option value="chronological">Chronological</option>
            </select>
          )}
          {currentView === 'photos' && (
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              + Upload Photos
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          )}
          {currentView === 'albums' && (
            <button className="btn btn-primary" onClick={() => setShowCreateAlbum(true)}>
              + Create Album
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '2px solid var(--border)'
      }}>
        <button
          onClick={() => setCurrentView('albums')}
          style={{
            padding: '1rem 2rem',
            background: 'none',
            border: 'none',
            borderBottom: currentView === 'albums' ? '3px solid var(--primary)' : '3px solid transparent',
            color: currentView === 'albums' ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Albums ({albums.length})
        </button>
        <button
          onClick={() => {
            setCurrentView('photos')
            setSelectedAlbum(null)
          }}
          style={{
            padding: '1rem 2rem',
            background: 'none',
            border: 'none',
            borderBottom: currentView === 'photos' ? '3px solid var(--primary)' : '3px solid transparent',
            color: currentView === 'photos' ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          All Photos ({photos.length})
        </button>
      </div>

      {/* Photos View */}
      {currentView === 'photos' && (
        <>
          {photos.length === 0 ? (
            <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <p style={{
                fontSize: '1.2rem',
                color: 'var(--text-secondary)',
                marginBottom: '2rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
              }}>
                No photos yet. Upload your first photo to start building your family gallery!
              </p>
              <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                Upload Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'photo-grid' : 'photo-chronological'}>
              {sortedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="photo-item"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <AuthenticatedImage
                    photoId={photo.id}
                    alt={photo.title || 'Photo'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Albums View */}
      {currentView === 'albums' && (
        <>
          {selectedAlbum ? (
            <div>
              <button
                onClick={() => setSelectedAlbum(null)}
                className="btn btn-secondary"
                style={{ marginBottom: '1.5rem' }}
              >
                ← Back to Albums
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2>{selectedAlbum.name}</h2>
                  {selectedAlbum.description && (
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}>
                      {selectedAlbum.description}
                    </p>
                  )}
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}>
                    {albumPhotos.length} {albumPhotos.length === 1 ? 'photo' : 'photos'}
                  </p>
                </div>
                {user?.is_admin && (
                  <button
                    onClick={() => handleDeleteAlbum(selectedAlbum.id)}
                    className="btn"
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px'
                    }}
                  >
                    Delete Album
                  </button>
                )}
              </div>
              {albumPhotos.length === 0 ? (
                <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' }}>
                    No photos in this album yet.
                  </p>
                </div>
              ) : (
                <div className="photo-grid">
                  {albumPhotos.map((photo) => (
                    <div key={photo.id} className="photo-item" style={{ position: 'relative' }}>
                      <AuthenticatedImage
                        photoId={photo.id}
                        alt={photo.title || 'Photo'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onClick={() => setSelectedPhoto(photo)}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemovePhotoFromAlbum(photo.id, selectedAlbum.id)
                        }}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          background: 'rgba(220, 53, 69, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {albums.length === 0 ? (
                <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <p style={{
                    fontSize: '1.2rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '2rem',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                  }}>
                    No albums yet. Create your first album to organize your photos!
                  </p>
                  <button className="btn btn-primary" onClick={() => setShowCreateAlbum(true)}>
                    Create Album
                  </button>
                </div>
              ) : (
                <div className="grid grid-3">
                  {albums.map((album) => (
                    <div key={album.id} className="card" style={{ cursor: 'pointer' }} onClick={() => handleViewAlbum(album.id)}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>📁</div>
                      <h3 style={{ marginBottom: '0.5rem' }}>{album.name}</h3>
                      {album.description && (
                        <p style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.9rem',
                          marginBottom: '0.75rem',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                        }}>
                          {album.description}
                        </p>
                      )}
                      <p style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                      }}>
                        {album.photo_count || 0} {album.photo_count === 1 ? 'photo' : 'photos'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {selectedPhoto && (
        <div className="modal" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content photo-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px' }}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--primary)' }}>{selectedPhoto.title || 'Photo'}</h2>
              <button className="close-btn" onClick={() => setSelectedPhoto(null)}>×</button>
            </div>
            <AuthenticatedImage
              photoId={selectedPhoto.id}
              alt={selectedPhoto.title || 'Photo'}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '12px',
                boxShadow: '0 4px 20px var(--shadow)'
              }}
            />
            {selectedPhoto.description && (
              <p style={{
                marginTop: '1.5rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
              }}>{selectedPhoto.description}</p>
            )}
            <p style={{
              color: 'var(--text-muted)',
              marginTop: '1rem',
              fontSize: '0.9rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
            }}>
              Uploaded: {format(new Date(selectedPhoto.created_at), 'MMMM d, yyyy')}
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                {albums.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value=""
                      onChange={(e) => {
                        const albumId = e.target.value
                        if (albumId) {
                          handleAddPhotoToAlbum(selectedPhoto.id, parseInt(albumId))
                        }
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: '2px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="" disabled>Add to album...</option>
                      {albums.map((album) => (
                        <option key={album.id} value={album.id}>{album.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {user?.is_admin && (
                <button
                  className="btn"
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Delete Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Album Modal */}
      {showCreateAlbum && (
        <div className="modal" onClick={() => setShowCreateAlbum(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Create New Album</h2>
              <button className="close-btn" onClick={() => setShowCreateAlbum(false)}>×</button>
            </div>
            <form onSubmit={handleCreateAlbum}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Album Name *
                </label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="Enter album name"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Description
                </label>
                <textarea
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                  placeholder="Enter album description (optional)"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateAlbum(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoGallery

