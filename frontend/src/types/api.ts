export interface User {
  id: number; username: string; email: string | null; full_name: string | null
  is_admin: boolean; is_active: boolean; created_at: string
}
export interface TokenResponse { access_token: string; token_type: string; user: User }
export interface UserRegister { username: string; password: string; email?: string; full_name?: string; invite_code: string }
export interface UserLogin { username: string; password: string }
export interface PasswordChange { current_password: string; new_password: string }

export interface InviteCode { id: number; code: string; email: string | null; used_by_id: number | null; expires_at: string | null; created_at: string; email_sent?: boolean | null }
export interface InviteCodeCreate { email?: string; expires_at?: string }

export interface VignettePhoto { id: number; photo_id: number; url: string | null }
export interface Vignette { id: number; title: string; content: string | null; author_id: number; sort_order: number; created_at: string; updated_at: string; photos: VignettePhoto[] }
export interface VignetteCreate { title: string; content?: string }
export interface VignetteUpdate { title?: string; content?: string; sort_order?: number }

export interface Photo { id: number; filename: string; file_path: string; url: string | null; title: string | null; description: string | null; uploaded_by_id: number; taken_at: string | null; sort_order: number; created_at: string }
export interface PhotoUpdate { title?: string; description?: string; taken_at?: string }

export interface Album { id: number; name: string; description: string | null; created_by_id: number; sort_order: number; background_image: string | null; created_at: string; photo_count: number }
export interface AlbumCreate { name: string; description?: string }
export interface AlbumUpdate { name?: string; description?: string; sort_order?: number }

export interface AudioRecording { id: number; filename: string; file_path: string; url: string | null; title: string | null; description: string | null; author_id: number; duration_seconds: number | null; created_at: string }

export interface FileRecord { id: number; filename: string; file_path: string; url: string | null; title: string | null; description: string | null; file_type: string | null; source: string; uploaded_by_id: number; created_at: string }

export interface FamilyMember { id: number; first_name: string; last_name: string | null; birth_date: string | null; death_date: string | null; bio: string | null; photo_id: number | null; position_x: number; position_y: number; created_by_id: number; created_at: string }
export interface FamilyMemberCreate { first_name: string; last_name?: string; birth_date?: string; death_date?: string; bio?: string; position_x?: number; position_y?: number }

export interface FamilyRelationship { id: number; person_a_id: number; person_b_id: number; relationship_type: 'parent_child' | 'spouse' | 'sibling'; created_at: string }
export interface FamilyRelationshipCreate { person_a_id: number; person_b_id: number; relationship_type: 'parent_child' | 'spouse' | 'sibling' }

export interface Tag { id: number; name: string; category: 'person' | 'place' | 'event' | 'topic'; created_at: string }
export interface TagCreate { name: string; category: 'person' | 'place' | 'event' | 'topic' }
export interface ContentTag { id: number; tag_id: number; content_type: string; content_id: number; tag: Tag; created_at: string }
export interface ContentTagCreate { tag_id: number; content_type: string; content_id: number }

export interface SearchResult { content_type: string; id: number; title: string; snippet: string | null; created_at: string }
export interface TimelineItem { content_type: string; id: number; title: string; description: string | null; thumbnail_url: string | null; created_at: string }

export interface DashboardStats { vignettes: number; photos: number; audio_recordings: number; files: number; family_members: number }
export interface UserAdminUpdate { is_active?: boolean; is_admin?: boolean; full_name?: string; email?: string }

export interface SmtpConfig { smtp_host: string; smtp_port: number; smtp_user: string; smtp_password: string; from_email: string; from_name: string; admin_email: string; site_url: string }
export interface SmtpConfigResponse { smtp_host: string; smtp_port: number; smtp_user: string; from_email: string; from_name: string; admin_email: string; site_url: string; configured: boolean }
