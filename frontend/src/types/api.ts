// Types matching backend Pydantic schemas (backend/app/schemas.py)

export interface User {
  id: number
  username: string
  email: string | null
  full_name: string | null
  is_active: boolean
  is_admin: boolean
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Vignette {
  id: number
  title: string
  content: string | null
  author_id: number
  sort_order: number | null
  created_at: string
  updated_at: string | null
  photos: Photo[]
}

export interface VignetteCreate {
  title: string
  content?: string
  photo_ids?: number[]
}

export interface VignetteUpdate {
  title?: string
  content?: string
  created_at?: string
}

export interface Photo {
  id: number
  filename: string
  title: string | null
  description: string | null
  uploaded_by_id: number
  created_at: string
  taken_at: string | null
  sort_order: number | null
}

export interface PhotoUpdate {
  title?: string
  description?: string
  taken_at?: string
}

export interface Album {
  id: number
  name: string
  description: string | null
  created_by_id: number
  created_at: string
  photo_count: number
  background_image: string | null
  sort_order: number | null
}

export interface AlbumWithPhotos extends Album {
  photos: Photo[]
}

export interface AlbumCreate {
  name: string
  description?: string
  photo_ids?: number[]
}

export interface AudioRecording {
  id: number
  filename: string
  title: string | null
  description: string | null
  author_id: number
  duration_seconds: number | null
  created_at: string
}

export interface FileItem {
  id: number
  filename: string
  title: string | null
  description: string | null
  file_type: string | null
  uploaded_by_id: number
  source: string | null
  created_at: string
}

export interface FileUpdate {
  title?: string
  description?: string
  created_at?: string
}

export interface InviteCode {
  id: number
  code: string
  email: string | null
  created_by_id: number
  used_by_id: number | null
  created_at: string
  used_at: string | null
  expires_at: string | null
  is_used: boolean
}

export interface InviteCodeWithUser extends InviteCode {
  used_by_username: string | null
  used_by_email: string | null
  used_by_full_name: string | null
}

export interface InviteCodeCreate {
  email?: string
  expires_in_days?: number
  send_email?: boolean
  recipient_name?: string
}

export interface BackgroundImage {
  id: number
  filename: string
  file_path: string
  url?: string
  uploaded_by_id: number
  created_at: string
  is_active: boolean
}

export interface Person {
  id: number
  name: string
  created_at: string
}

export interface PasswordChange {
  current_password: string
  new_password: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordReset {
  token: string
  new_password: string
}

export interface RegisterData {
  username: string
  password: string
  email?: string
  full_name?: string
  invite_code: string
}

export interface SortOrderItem {
  id: number
  sort_order: number
}

// Family Tree

export interface FamilyMember {
  id: number
  first_name: string
  last_name: string
  birth_date: string | null
  death_date: string | null
  bio: string | null
  photo_id: number | null
  created_by_id: number
  position_x: number
  position_y: number
  created_at: string
}

export interface FamilyMemberCreate {
  first_name: string
  last_name: string
  birth_date?: string
  death_date?: string
  bio?: string
  photo_id?: number
}

export interface FamilyMemberUpdate {
  first_name?: string
  last_name?: string
  birth_date?: string | null
  death_date?: string | null
  bio?: string | null
  photo_id?: number | null
  position_x?: number
  position_y?: number
}

export interface FamilyRelationship {
  id: number
  person_a_id: number
  person_b_id: number
  relationship_type: 'parent_child' | 'spouse' | 'sibling'
  created_at: string
}

export interface FamilyRelationshipCreate {
  person_a_id: number
  person_b_id: number
  relationship_type: 'parent_child' | 'spouse' | 'sibling'
}

export interface FamilyTreeData {
  members: FamilyMember[]
  relationships: FamilyRelationship[]
}

export interface NodePosition {
  id: number
  position_x: number
  position_y: number
}

// Search & Tags

export interface Tag {
  id: number
  name: string
  category: string
  created_at: string
}

export interface TagCreate {
  name: string
  category?: string
}

export interface SearchResult {
  content_type: 'vignette' | 'photo' | 'audio' | 'file'
  content_id: number
  title: string
  description: string | null
  created_at: string
  tags: Tag[]
}

export interface SearchParams {
  q: string
  type?: string
}
