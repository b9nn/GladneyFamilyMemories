import os
import secrets
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File as F, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse as _StaticFileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from .database import get_db, init_db
from . import models
from .schemas import *
from .auth import hash_password, verify_password, create_access_token, get_current_user, get_current_admin_user
from .storage import upload_file, get_file_url, delete_file
from . import email as email_mod

app = FastAPI(title="Gladney Family Tree API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://mrtag.com", "http://mrtag.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("uploads").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.on_event("startup")
def startup():
    init_db()


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/auth/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=TokenResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    invite = db.query(models.InviteCode).filter(
        models.InviteCode.code == payload.invite_code,
        models.InviteCode.used_by_id == None,  # noqa: E711
    ).first()
    if not invite:
        raise HTTPException(400, "Invalid or already-used invite code")
    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(400, "Username already taken")

    user = models.User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.flush()
    invite.used_by_id = user.id
    db.commit()
    db.refresh(user)
    email_mod.notify_admin_new_registration(user.username, user.email or "", db)
    return TokenResponse(access_token=create_access_token({"sub": str(user.id)}), user=UserResponse.model_validate(user))


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Invalid username or password")
    if not user.is_active:
        raise HTTPException(403, "Account is disabled")
    return TokenResponse(access_token=create_access_token({"sub": str(user.id)}), user=UserResponse.model_validate(user))


@app.get("/api/auth/me", response_model=UserResponse)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ── Users ─────────────────────────────────────────────────────────────────────

@app.put("/api/users/me/password")
def change_password(payload: PasswordChange, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(400, "Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated"}


# ── Bootstrap (create first admin) ───────────────────────────────────────────

@app.post("/api/admin/bootstrap")
def bootstrap(username: str = Form(...), password: str = Form(...), secret: str = Form(...), db: Session = Depends(get_db)):
    bs = os.getenv("BOOTSTRAP_SECRET", "")
    if not bs or secret != bs:
        raise HTTPException(403, "Invalid bootstrap secret")
    if db.query(models.User).filter(models.User.is_admin == True).first():  # noqa: E712
        raise HTTPException(400, "Admin already exists")
    user = models.User(username=username, hashed_password=hash_password(password), is_admin=True, is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Admin created", "access_token": create_access_token({"sub": str(user.id)})}


# ── Admin: Users ──────────────────────────────────────────────────────────────

@app.get("/api/admin/users", response_model=List[UserResponse])
def admin_list_users(db: Session = Depends(get_db), _: models.User = Depends(get_current_admin_user)):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@app.put("/api/admin/users/{user_id}", response_model=UserResponse)
def admin_update_user(user_id: int, payload: UserAdminUpdate, db: Session = Depends(get_db), _: models.User = Depends(get_current_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(user, field, val)
    db.commit()
    db.refresh(user)
    return user


# ── Admin: Invite Codes ───────────────────────────────────────────────────────

@app.get("/api/admin/invite-codes", response_model=List[InviteCodeResponse])
def list_invite_codes(db: Session = Depends(get_db), _: models.User = Depends(get_current_admin_user)):
    return db.query(models.InviteCode).order_by(models.InviteCode.created_at.desc()).all()


@app.post("/api/admin/invite-codes", response_model=InviteCodeResponse)
def create_invite_code(payload: InviteCodeCreate, db: Session = Depends(get_db), cu: models.User = Depends(get_current_admin_user)):
    code = models.InviteCode(code=secrets.token_urlsafe(16), email=payload.email, created_by_id=cu.id, expires_at=payload.expires_at)
    db.add(code)
    db.commit()
    db.refresh(code)
    return code


@app.post("/api/admin/invite-codes/send", response_model=InviteCodeResponse)
def send_invite(payload: InviteEmailRequest, db: Session = Depends(get_db), cu: models.User = Depends(get_current_admin_user)):
    code = models.InviteCode(code=secrets.token_urlsafe(16), email=payload.email, created_by_id=cu.id)
    db.add(code)
    db.commit()
    db.refresh(code)
    sent = email_mod.send_invite_email(payload.email, payload.name, code.code, db)
    result = InviteCodeResponse.model_validate(code)
    result.email_sent = sent
    return result


@app.delete("/api/admin/invite-codes/{code_id}")
def delete_invite_code(code_id: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_admin_user)):
    code = db.query(models.InviteCode).filter(models.InviteCode.id == code_id).first()
    if not code:
        raise HTTPException(404, "Not found")
    db.delete(code)
    db.commit()
    return {"message": "Deleted"}


# ── Admin: Background Image ───────────────────────────────────────────────────

@app.post("/api/admin/background")
async def upload_background(file: UploadFile = F(...), db: Session = Depends(get_db), cu: models.User = Depends(get_current_admin_user)):
    content = await file.read()
    key, url = upload_file(content, file.filename or "bg", "background", file.content_type, convert_heic=True)
    db.query(models.BackgroundImage).update({"is_active": False})
    bg = models.BackgroundImage(filename=file.filename or "bg", file_path=key, uploaded_by_id=cu.id, is_active=True)
    db.add(bg)
    db.commit()
    return {"url": url, "message": "Background updated"}


# ── Admin: SMTP Config ────────────────────────────────────────────────────────

@app.get("/api/admin/smtp-config", response_model=SmtpConfigResponse)
def get_smtp_config_endpoint(db: Session = Depends(get_db), _: models.User = Depends(get_current_admin_user)):
    cfg = email_mod.get_smtp_config(db)
    return SmtpConfigResponse(
        smtp_host=cfg['smtp_host'],
        smtp_port=cfg['smtp_port'],
        smtp_user=cfg['smtp_user'],
        from_email=cfg['from_email'],
        from_name=cfg['from_name'],
        admin_email=cfg['admin_email'],
        site_url=cfg['site_url'],
        configured=bool(cfg['smtp_host'] and cfg['smtp_user']),
    )


@app.put("/api/admin/smtp-config", response_model=SmtpConfigResponse)
def update_smtp_config(payload: SmtpConfig, db: Session = Depends(get_db), _: models.User = Depends(get_current_admin_user)):
    fields = {
        'smtp_host': payload.smtp_host,
        'smtp_port': str(payload.smtp_port),
        'smtp_user': payload.smtp_user,
        'from_email': payload.from_email,
        'from_name': payload.from_name,
        'admin_email': payload.admin_email,
        'site_url': payload.site_url,
    }
    if payload.smtp_password:
        fields['smtp_password'] = payload.smtp_password
    for key, value in fields.items():
        setting = db.query(models.SiteSetting).filter(models.SiteSetting.key == key).first()
        if setting:
            setting.value = value
        else:
            db.add(models.SiteSetting(key=key, value=value))
    db.commit()
    cfg = email_mod.get_smtp_config(db)
    return SmtpConfigResponse(
        smtp_host=cfg['smtp_host'],
        smtp_port=cfg['smtp_port'],
        smtp_user=cfg['smtp_user'],
        from_email=cfg['from_email'],
        from_name=cfg['from_name'],
        admin_email=cfg['admin_email'],
        site_url=cfg['site_url'],
        configured=bool(cfg['smtp_host'] and cfg['smtp_user']),
    )


@app.post("/api/admin/smtp-config/test")
def test_smtp_config(db: Session = Depends(get_db), cu: models.User = Depends(get_current_admin_user)):
    cfg = email_mod.get_smtp_config(db)
    if not cfg['smtp_host'] or not cfg['smtp_user']:
        raise HTTPException(400, "SMTP not configured")
    test_to = cfg['admin_email'] or cu.email
    if not test_to:
        raise HTTPException(400, "No recipient email — set Admin Email in SMTP config")
    sent = email_mod.send_email(
        test_to,
        "Test email from Gladney Family Tree",
        "<h2>SMTP test</h2><p>If you received this, your SMTP configuration is working correctly.</p>",
        db,
    )
    if not sent:
        raise HTTPException(500, "Failed to send test email — check server logs")
    return {"message": f"Test email sent to {test_to}"}


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/api/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    return {
        "vignettes": db.query(models.Vignette).count(),
        "photos": db.query(models.Photo).count(),
        "audio_recordings": db.query(models.AudioRecording).count(),
        "files": db.query(models.File).filter(models.File.source == "files").count(),
        "family_members": db.query(models.FamilyMember).count(),
    }


@app.get("/api/dashboard/background")
def dashboard_background(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    bg = db.query(models.BackgroundImage).filter(models.BackgroundImage.is_active == True).first()  # noqa: E712
    return {"url": get_file_url(bg.file_path) if bg else None}


# ── Vignettes ─────────────────────────────────────────────────────────────────

@app.get("/api/vignettes", response_model=List[VignetteResponse])
def list_vignettes(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    return db.query(models.Vignette).order_by(models.Vignette.sort_order, models.Vignette.created_at.desc()).all()


@app.post("/api/vignettes", response_model=VignetteResponse)
def create_vignette(payload: VignetteCreate, db: Session = Depends(get_db), cu: models.User = Depends(get_current_user)):
    v = models.Vignette(title=payload.title, content=payload.content, author_id=cu.id)
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@app.get("/api/vignettes/{vid}", response_model=VignetteResponse)
def get_vignette(vid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    v = db.query(models.Vignette).filter(models.Vignette.id == vid).first()
    if not v:
        raise HTTPException(404, "Not found")
    return v


@app.put("/api/vignettes/{vid}", response_model=VignetteResponse)
def update_vignette(vid: int, payload: VignetteUpdate, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    v = db.query(models.Vignette).filter(models.Vignette.id == vid).first()
    if not v:
        raise HTTPException(404, "Not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(v, field, val)
    db.commit()
    db.refresh(v)
    return v


@app.delete("/api/vignettes/{vid}")
def delete_vignette(vid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    v = db.query(models.Vignette).filter(models.Vignette.id == vid).first()
    if not v:
        raise HTTPException(404, "Not found")
    db.delete(v)
    db.commit()
    return {"message": "Deleted"}


# ── Photos ────────────────────────────────────────────────────────────────────

@app.get("/api/photos", response_model=List[PhotoResponse])
def list_photos(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    photos = db.query(models.Photo).order_by(models.Photo.sort_order, models.Photo.created_at.desc()).all()
    result = []
    for p in photos:
        d = PhotoResponse.model_validate(p)
        d.url = get_file_url(p.file_path)
        result.append(d)
    return result


@app.post("/api/photos", response_model=PhotoResponse)
async def upload_photo(
    file: UploadFile = F(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    cu: models.User = Depends(get_current_user),
):
    content = await file.read()
    key, url = upload_file(content, file.filename or "photo", "photos", file.content_type, convert_heic=True)
    photo = models.Photo(filename=file.filename or "photo", file_path=key, title=title, description=description, uploaded_by_id=cu.id)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    result = PhotoResponse.model_validate(photo)
    result.url = url
    return result


@app.put("/api/photos/{pid}", response_model=PhotoResponse)
def update_photo(pid: int, payload: PhotoUpdate, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    p = db.query(models.Photo).filter(models.Photo.id == pid).first()
    if not p:
        raise HTTPException(404, "Not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(p, field, val)
    db.commit()
    db.refresh(p)
    result = PhotoResponse.model_validate(p)
    result.url = get_file_url(p.file_path)
    return result


@app.delete("/api/photos/{pid}")
def delete_photo(pid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    p = db.query(models.Photo).filter(models.Photo.id == pid).first()
    if not p:
        raise HTTPException(404, "Not found")
    delete_file(p.file_path)
    db.delete(p)
    db.commit()
    return {"message": "Deleted"}


# ── Albums ────────────────────────────────────────────────────────────────────

@app.get("/api/albums", response_model=List[AlbumResponse])
def list_albums(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    albums = db.query(models.Album).order_by(models.Album.sort_order, models.Album.created_at.desc()).all()
    result = []
    for a in albums:
        d = AlbumResponse.model_validate(a)
        d.photo_count = len(a.album_photos)
        result.append(d)
    return result


@app.post("/api/albums", response_model=AlbumResponse)
def create_album(payload: AlbumCreate, db: Session = Depends(get_db), cu: models.User = Depends(get_current_user)):
    a = models.Album(name=payload.name, description=payload.description, created_by_id=cu.id)
    db.add(a)
    db.commit()
    db.refresh(a)
    result = AlbumResponse.model_validate(a)
    result.photo_count = 0
    return result


@app.put("/api/albums/{aid}", response_model=AlbumResponse)
def update_album(aid: int, payload: AlbumUpdate, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    a = db.query(models.Album).filter(models.Album.id == aid).first()
    if not a:
        raise HTTPException(404, "Not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(a, field, val)
    db.commit()
    db.refresh(a)
    result = AlbumResponse.model_validate(a)
    result.photo_count = len(a.album_photos)
    return result


@app.delete("/api/albums/{aid}")
def delete_album(aid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    a = db.query(models.Album).filter(models.Album.id == aid).first()
    if not a:
        raise HTTPException(404, "Not found")
    db.delete(a)
    db.commit()
    return {"message": "Deleted"}


@app.get("/api/albums/{aid}/photos", response_model=List[PhotoResponse])
def album_photos(aid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    a = db.query(models.Album).filter(models.Album.id == aid).first()
    if not a:
        raise HTTPException(404, "Not found")
    result = []
    for ap in a.album_photos:
        d = PhotoResponse.model_validate(ap.photo)
        d.url = get_file_url(ap.photo.file_path)
        result.append(d)
    return result


@app.post("/api/albums/{aid}/photos/{pid}")
def add_to_album(aid: int, pid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    if not db.query(models.Album).filter(models.Album.id == aid).first():
        raise HTTPException(404, "Album not found")
    if not db.query(models.Photo).filter(models.Photo.id == pid).first():
        raise HTTPException(404, "Photo not found")
    if not db.query(models.AlbumPhoto).filter(models.AlbumPhoto.album_id == aid, models.AlbumPhoto.photo_id == pid).first():
        db.add(models.AlbumPhoto(album_id=aid, photo_id=pid))
        db.commit()
    return {"message": "Added"}


@app.put("/api/albums/{aid}/cover/{pid}", response_model=AlbumResponse)
def set_album_cover(aid: int, pid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    album = db.query(models.Album).filter(models.Album.id == aid).first()
    if not album:
        raise HTTPException(404, "Album not found")
    photo = db.query(models.Photo).filter(models.Photo.id == pid).first()
    if not photo:
        raise HTTPException(404, "Photo not found")
    url = get_file_url(photo.file_path)
    album.background_image = url
    db.commit()
    db.refresh(album)
    result = AlbumResponse.model_validate(album)
    result.photo_count = len(album.album_photos)
    return result


@app.delete("/api/albums/{aid}/photos/{pid}")
def remove_from_album(aid: int, pid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    ap = db.query(models.AlbumPhoto).filter(models.AlbumPhoto.album_id == aid, models.AlbumPhoto.photo_id == pid).first()
    if ap:
        db.delete(ap)
        db.commit()
    return {"message": "Removed"}


# ── Audio ─────────────────────────────────────────────────────────────────────

@app.get("/api/audio", response_model=List[AudioRecordingResponse])
def list_audio(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    recordings = db.query(models.AudioRecording).order_by(models.AudioRecording.created_at.desc()).all()
    result = []
    for r in recordings:
        d = AudioRecordingResponse.model_validate(r)
        d.url = get_file_url(r.file_path)
        result.append(d)
    return result


@app.post("/api/audio", response_model=AudioRecordingResponse)
async def upload_audio(
    file: UploadFile = F(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    duration_seconds: Optional[float] = Form(None),
    db: Session = Depends(get_db),
    cu: models.User = Depends(get_current_user),
):
    content = await file.read()
    key, url = upload_file(content, file.filename or "recording", "audio", file.content_type)
    r = models.AudioRecording(filename=file.filename or "recording", file_path=key, title=title, description=description, author_id=cu.id, duration_seconds=duration_seconds)
    db.add(r)
    db.commit()
    db.refresh(r)
    result = AudioRecordingResponse.model_validate(r)
    result.url = url
    return result


@app.put("/api/audio/{rid}", response_model=AudioRecordingResponse)
def update_audio(rid: int, payload: AudioRecordingUpdate, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    r = db.query(models.AudioRecording).filter(models.AudioRecording.id == rid).first()
    if not r:
        raise HTTPException(404, "Not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(r, field, val)
    db.commit()
    db.refresh(r)
    result = AudioRecordingResponse.model_validate(r)
    result.url = get_file_url(r.file_path)
    return result


@app.delete("/api/audio/{rid}")
def delete_audio(rid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    r = db.query(models.AudioRecording).filter(models.AudioRecording.id == rid).first()
    if not r:
        raise HTTPException(404, "Not found")
    delete_file(r.file_path)
    db.delete(r)
    db.commit()
    return {"message": "Deleted"}


# ── Files ─────────────────────────────────────────────────────────────────────

@app.get("/api/files", response_model=List[FileResponse])
def list_files(source: str = Query("files"), db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    files = db.query(models.File).filter(models.File.source == source).order_by(models.File.created_at.desc()).all()
    result = []
    for f in files:
        d = FileResponse.model_validate(f)
        d.url = get_file_url(f.file_path)
        result.append(d)
    return result


@app.post("/api/files", response_model=FileResponse)
async def upload_file_ep(
    file: UploadFile = F(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    source: str = Form("files"),
    db: Session = Depends(get_db),
    cu: models.User = Depends(get_current_user),
):
    content = await file.read()
    ct = file.content_type or "application/octet-stream"
    if ct.startswith("video/") and len(content) > 500 * 1024 * 1024:
        raise HTTPException(400, "Video exceeds 500MB limit")
    key, url = upload_file(content, file.filename or "file", "files", ct)
    f = models.File(filename=file.filename or "file", file_path=key, title=title, description=description, file_type=ct, source=source, uploaded_by_id=cu.id)
    db.add(f)
    db.commit()
    db.refresh(f)
    result = FileResponse.model_validate(f)
    result.url = url
    return result


@app.delete("/api/files/{fid}")
def delete_file_ep(fid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    f = db.query(models.File).filter(models.File.id == fid).first()
    if not f:
        raise HTTPException(404, "Not found")
    delete_file(f.file_path)
    db.delete(f)
    db.commit()
    return {"message": "Deleted"}


# ── Family Tree ───────────────────────────────────────────────────────────────

@app.get("/api/family-tree/members", response_model=List[FamilyMemberResponse])
def list_members(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    return db.query(models.FamilyMember).all()


@app.post("/api/family-tree/members", response_model=FamilyMemberResponse)
def create_member(payload: FamilyMemberCreate, db: Session = Depends(get_db), cu: models.User = Depends(get_current_user)):
    m = models.FamilyMember(**payload.model_dump(), created_by_id=cu.id)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@app.put("/api/family-tree/members/{mid}", response_model=FamilyMemberResponse)
def update_member(mid: int, payload: FamilyMemberUpdate, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    m = db.query(models.FamilyMember).filter(models.FamilyMember.id == mid).first()
    if not m:
        raise HTTPException(404, "Not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(m, field, val)
    db.commit()
    db.refresh(m)
    return m


@app.delete("/api/family-tree/members/{mid}")
def delete_member(mid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    m = db.query(models.FamilyMember).filter(models.FamilyMember.id == mid).first()
    if not m:
        raise HTTPException(404, "Not found")
    db.delete(m)
    db.commit()
    return {"message": "Deleted"}


@app.get("/api/family-tree/relationships", response_model=List[FamilyRelationshipResponse])
def list_relationships(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    return db.query(models.FamilyRelationship).all()


@app.post("/api/family-tree/relationships", response_model=FamilyRelationshipResponse)
def create_relationship(payload: FamilyRelationshipCreate, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    rel = models.FamilyRelationship(**payload.model_dump())
    db.add(rel)
    db.commit()
    db.refresh(rel)
    return rel


@app.delete("/api/family-tree/relationships/{rid}")
def delete_relationship(rid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    rel = db.query(models.FamilyRelationship).filter(models.FamilyRelationship.id == rid).first()
    if not rel:
        raise HTTPException(404, "Not found")
    db.delete(rel)
    db.commit()
    return {"message": "Deleted"}


# ── Tags ──────────────────────────────────────────────────────────────────────

@app.get("/api/tags", response_model=List[TagResponse])
def list_tags(category: Optional[str] = Query(None), db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    q = db.query(models.Tag)
    if category:
        q = q.filter(models.Tag.category == category)
    return q.order_by(models.Tag.category, models.Tag.name).all()


@app.post("/api/tags", response_model=TagResponse)
def create_tag(payload: TagCreate, db: Session = Depends(get_db), _: models.User = Depends(get_current_admin_user)):
    if db.query(models.Tag).filter(models.Tag.name == payload.name).first():
        raise HTTPException(400, "Tag already exists")
    tag = models.Tag(**payload.model_dump())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@app.delete("/api/tags/{tid}")
def delete_tag(tid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_admin_user)):
    tag = db.query(models.Tag).filter(models.Tag.id == tid).first()
    if not tag:
        raise HTTPException(404, "Not found")
    db.delete(tag)
    db.commit()
    return {"message": "Deleted"}


@app.post("/api/content-tags", response_model=ContentTagResponse)
def add_content_tag(payload: ContentTagCreate, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    ct = models.ContentTag(**payload.model_dump())
    db.add(ct)
    db.commit()
    db.refresh(ct)
    return ct


@app.delete("/api/content-tags/{ctid}")
def remove_content_tag(ctid: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    ct = db.query(models.ContentTag).filter(models.ContentTag.id == ctid).first()
    if not ct:
        raise HTTPException(404, "Not found")
    db.delete(ct)
    db.commit()
    return {"message": "Deleted"}


# ── Search ────────────────────────────────────────────────────────────────────

@app.get("/api/search", response_model=List[SearchResult])
def search(q: str = Query(..., min_length=1), db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    like = f"%{q}%"
    results: List[SearchResult] = []
    for v in db.query(models.Vignette).filter(models.Vignette.title.ilike(like) | models.Vignette.content.ilike(like)).limit(10).all():
        results.append(SearchResult(content_type="vignette", id=v.id, title=v.title, created_at=v.created_at))
    for p in db.query(models.Photo).filter(models.Photo.title.ilike(like) | models.Photo.description.ilike(like)).limit(10).all():
        results.append(SearchResult(content_type="photo", id=p.id, title=p.title or p.filename, created_at=p.created_at))
    for a in db.query(models.AudioRecording).filter(models.AudioRecording.title.ilike(like) | models.AudioRecording.description.ilike(like)).limit(10).all():
        results.append(SearchResult(content_type="audio", id=a.id, title=a.title or a.filename, created_at=a.created_at))
    for f in db.query(models.File).filter(models.File.source == "files").filter(models.File.title.ilike(like) | models.File.description.ilike(like) | models.File.extracted_text.ilike(like)).limit(10).all():
        results.append(SearchResult(content_type="file", id=f.id, title=f.title or f.filename, created_at=f.created_at))
    results.sort(key=lambda x: x.created_at, reverse=True)
    return results


# ── Timeline ──────────────────────────────────────────────────────────────────

@app.get("/api/timeline", response_model=List[TimelineItem])
def timeline(
    content_types: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    types = set(content_types.split(",")) if content_types else {"vignette", "photo", "audio", "file"}
    items: List[TimelineItem] = []
    if "vignette" in types:
        for v in db.query(models.Vignette).all():
            items.append(TimelineItem(content_type="vignette", id=v.id, title=v.title, created_at=v.created_at))
    if "photo" in types:
        for p in db.query(models.Photo).all():
            items.append(TimelineItem(content_type="photo", id=p.id, title=p.title or p.filename, thumbnail_url=get_file_url(p.file_path), created_at=p.created_at))
    if "audio" in types:
        for a in db.query(models.AudioRecording).all():
            items.append(TimelineItem(content_type="audio", id=a.id, title=a.title or a.filename, created_at=a.created_at))
    if "file" in types:
        for f in db.query(models.File).filter(models.File.source == "files").all():
            items.append(TimelineItem(content_type="file", id=f.id, title=f.title or f.filename, created_at=f.created_at))
    items.sort(key=lambda x: x.created_at, reverse=True)
    return items[offset: offset + limit]


# ── SPA static file serving (production only) ─────────────────────────────────

_FRONTEND_DIST = Path(__file__).parent.parent.parent / "frontend" / "dist"

if _FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(_FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        file = _FRONTEND_DIST / full_path
        if file.exists() and file.is_file():
            return _StaticFileResponse(str(file))
        return _StaticFileResponse(str(_FRONTEND_DIST / "index.html"))
