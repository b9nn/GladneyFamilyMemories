from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    invite_code: str

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional["UserResponse"] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_admin: bool
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ── Invite Codes ──────────────────────────────────────────────────────────────

class InviteCodeCreate(BaseModel):
    email: Optional[str] = None
    expires_at: Optional[datetime] = None

class InviteEmailRequest(BaseModel):
    email: str
    name: str

class InviteCodeResponse(BaseModel):
    id: int
    code: str
    email: Optional[str] = None
    used_by_id: Optional[int] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    email_sent: Optional[bool] = None
    model_config = {"from_attributes": True}


# ── Vignettes ─────────────────────────────────────────────────────────────────

class VignetteReorderItem(BaseModel):
    id: int
    sort_order: int

class VignetteCreate(BaseModel):
    title: str
    content: Optional[str] = None

class VignetteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    sort_order: Optional[int] = None

class VignettePhotoItem(BaseModel):
    id: int
    photo_id: int
    url: Optional[str] = None
    model_config = {"from_attributes": True}

class VignetteResponse(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    author_id: int
    sort_order: int
    created_at: datetime
    updated_at: datetime
    photos: List["VignettePhotoItem"] = []
    model_config = {"from_attributes": True}


# ── Photos ────────────────────────────────────────────────────────────────────

class PhotoResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    url: Optional[str] = None
    thumb_url: Optional[str] = None
    medium_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    uploaded_by_id: int
    taken_at: Optional[datetime] = None
    sort_order: int
    created_at: datetime
    model_config = {"from_attributes": True}

class PhotoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    taken_at: Optional[datetime] = None


# ── Albums ────────────────────────────────────────────────────────────────────

class AlbumCreate(BaseModel):
    name: str
    description: Optional[str] = None

class AlbumUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None

class AlbumReorderItem(BaseModel):
    id: int
    sort_order: int

class AlbumPhotoReorderItem(BaseModel):
    photo_id: int
    sort_order: int

class AlbumResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_by_id: int
    sort_order: int
    background_image: Optional[str] = None
    created_at: datetime
    photo_count: int = 0
    model_config = {"from_attributes": True}


# ── Audio ─────────────────────────────────────────────────────────────────────

class AudioRecordingResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    author_id: int
    duration_seconds: Optional[float] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class AudioRecordingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


# ── Files ─────────────────────────────────────────────────────────────────────

class FileUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class FileReorderItem(BaseModel):
    id: int
    sort_order: int


class FileResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    file_type: Optional[str] = None
    source: str
    uploaded_by_id: int
    sort_order: int = 0
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Family Tree ───────────────────────────────────────────────────────────────

class FamilyMemberCreate(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    bio: Optional[str] = None
    gender: Optional[str] = None
    position_x: float = 0.0
    position_y: float = 0.0

class FamilyMemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    bio: Optional[str] = None
    gender: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None

class FamilyMemberResponse(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    bio: Optional[str] = None
    gender: Optional[str] = None
    photo_id: Optional[int] = None
    position_x: float
    position_y: float
    created_by_id: int
    created_at: datetime
    model_config = {"from_attributes": True}

class FamilyRelationshipCreate(BaseModel):
    person_a_id: int
    person_b_id: int
    relationship_type: str

class FamilyRelationshipResponse(BaseModel):
    id: int
    person_a_id: int
    person_b_id: int
    relationship_type: str
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Tags ──────────────────────────────────────────────────────────────────────

class TagCreate(BaseModel):
    name: str
    category: str

class TagResponse(BaseModel):
    id: int
    name: str
    category: str
    created_at: datetime
    model_config = {"from_attributes": True}

class ContentTagCreate(BaseModel):
    tag_id: int
    content_type: str
    content_id: int

class ContentTagResponse(BaseModel):
    id: int
    tag_id: int
    content_type: str
    content_id: int
    tag: TagResponse
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Search / Timeline ─────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    content_type: str
    id: int
    title: str
    snippet: Optional[str] = None
    created_at: datetime

class TimelineItem(BaseModel):
    content_type: str
    id: int
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    created_at: datetime


# ── Admin ─────────────────────────────────────────────────────────────────────

class UserAdminUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    full_name: Optional[str] = None
    email: Optional[str] = None

class DashboardStats(BaseModel):
    vignettes: int
    photos: int
    audio_recordings: int
    files: int
    family_members: int


# ── SMTP ──────────────────────────────────────────────────────────────────────

class SmtpConfig(BaseModel):
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""   # empty string means "leave unchanged"
    from_email: str = ""
    from_name: str = "Gladney Family Tree"
    admin_email: str = ""
    site_url: str = ""

class SmtpConfigResponse(BaseModel):
    smtp_host: str
    smtp_port: int
    smtp_user: str
    from_email: str
    from_name: str
    admin_email: str
    site_url: str
    configured: bool
