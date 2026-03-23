# Gladney Family Tree — Architecture
> Last updated: 2026-03-23

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│                                                             │
│   React 18 SPA (TypeScript, Tailwind v4, shadcn/ui)        │
│   mrtag.com  ←  GitHub Pages (gh-pages branch)             │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS /api/*
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     RENDER WEB SERVICE                       │
│                                                             │
│   FastAPI 0.115 (Python 3.11)                               │
│   gladney-family-backend.onrender.com                       │
│                                                             │
│   ┌──────────────┐    ┌──────────────────────────────────┐  │
│   │  PostgreSQL  │    │       Cloudflare R2 (S3)         │  │
│   │  (Render     │    │  Photos, videos, audio, files,   │  │
│   │  managed DB) │    │  thumbnails, backups             │  │
│   └──────────────┘    └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Local Development:**
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend: `http://localhost:8000` (uvicorn --reload)
- Database: SQLite file at `backend/tag_diary.db`
- Storage: Local filesystem at `backend/uploads/`

**Production:**
- Frontend: GitHub Pages → mrtag.com (CNAME)
- Backend: Render web service (same-origin — backend serves API only)
- Database: Render managed PostgreSQL
- Storage: Cloudflare R2

---

## Frontend Architecture

### Feature-Based Structure

Each page is a self-contained feature module under `src/features/`. A feature owns its components, hooks, and local types. Shared UI lives in `src/components/shared/`.

```
src/features/
  auth/
    components/     login-form.tsx, register-form.tsx
    hooks/          use-auth.ts (TanStack Query mutations)
    stores/         auth-store.ts (Zustand: token, user, login, logout)
    page.tsx
  vignettes/
    components/     vignette-card.tsx, vignette-editor.tsx (TipTap),
                    vignette-modal.tsx, sort-controls.tsx
    hooks/          use-vignettes.ts, use-vignette-files.ts
    page.tsx
  photos/
    components/     photo-grid.tsx, photo-modal.tsx, album-card.tsx,
                    album-view.tsx, album-create-dialog.tsx, photo-arrange.tsx
    hooks/          use-photos.ts, use-albums.ts
    page.tsx
  audio/
    components/     recording-card.tsx, recorder.tsx (MediaRecorder API)
    hooks/          use-recordings.ts
    page.tsx
  files/
    components/     file-card.tsx, file-preview.tsx
    hooks/          use-files.ts
    page.tsx
  family-tree/
    components/     tree-canvas.tsx (React Flow wrapper), member-node.tsx,
                    member-detail-panel.tsx, member-form-dialog.tsx,
                    relationship-form-dialog.tsx
    hooks/          use-family-tree.ts
    stores/         tree-store.ts (selected member, editing state)
    utils/          layout.ts (dagre auto-layout)
    page.tsx
  timeline/
    components/     timeline-event.tsx, filter-bar.tsx
    hooks/          use-timeline.ts
    page.tsx
  search/
    components/     command-palette.tsx, search-results.tsx,
                    tag-filter.tsx, tag-input.tsx
    hooks/          use-search.ts, use-tags.ts
    page.tsx
  admin/
    components/     user-table.tsx, invite-codes-panel.tsx,
                    background-upload.tsx, file-tools.tsx
    hooks/          use-admin.ts
    page.tsx
  dashboard/
    page.tsx
```

### Data Flow

```
Component
  └── custom hook (use-vignettes.ts)
        └── TanStack Query useQuery / useMutation
              └── API client (src/lib/api/vignettes.ts)
                    └── axios instance (src/lib/api/client.ts)
                          └── FastAPI /api/vignettes/*
```

### State Management

| State type | Tool | Where |
|---|---|---|
| Server data (fetch/cache) | TanStack Query | Feature hooks |
| Auth (token, user) | Zustand | `features/auth/stores/auth-store.ts` |
| Theme (light/dark) | Zustand + localStorage | `stores/theme-store.ts` |
| Family tree UI (selection) | Zustand | `features/family-tree/stores/tree-store.ts` |
| All other UI state | Local `useState` | Component level |

### Routing

React Router v6 with lazy-loaded pages and a `<ProtectedRoute>` wrapper:

```
/                   → redirect to /dashboard
/login              → LoginPage (public)
/register           → RegisterPage (public)
/dashboard          → DashboardPage (protected)
/vignettes          → VignettesPage (protected)
/photos             → PhotosPage (protected)
/photos/albums/:id  → AlbumDetailPage (protected)
/audio              → AudioPage (protected)
/files              → FilesPage (protected)
/family-tree        → FamilyTreePage (protected)
/timeline           → TimelinePage (protected)
/settings/password  → ChangePasswordPage (protected)
/admin              → AdminPage (protected + admin-only)
```

### API Client Layer

One file per resource in `src/lib/api/`. Each file exports typed async functions that call the axios instance. The axios instance (`client.ts`) handles:
- Base URL from `import.meta.env.VITE_API_URL` (empty string in prod → same-origin)
- JWT token injection from auth store on every request
- 401 → clear auth store + redirect to `/login`

```typescript
// Example pattern
// src/lib/api/vignettes.ts
export const getVignettes = (): Promise<Vignette[]> =>
  client.get('/api/vignettes').then(r => r.data)

export const createVignette = (data: CreateVignetteInput): Promise<Vignette> =>
  client.post('/api/vignettes', data).then(r => r.data)
```

---

## Backend Architecture

### Module Responsibilities

| File | Responsibility |
|---|---|
| `main.py` | App creation, CORS, middleware, router mounting, all ~60 endpoints |
| `models.py` | SQLAlchemy ORM models (17 tables) |
| `schemas.py` | Pydantic v2 request/response schemas |
| `database.py` | Engine, session factory, dual-mode DB detection |
| `auth.py` | `create_token()`, `verify_token()`, `get_current_user`, `get_current_admin_user` |
| `storage.py` | `upload_file()`, `delete_file()`, `get_url()`, HEIC conversion |
| `email.py` | `send_admin_notification()` via SMTP |

### Dual Database Mode

```python
# database.py
DATABASE_URL = os.getenv("DATABASE_URL")  # set in prod (PostgreSQL)
if DATABASE_URL:
    engine = create_async_engine(DATABASE_URL)   # PostgreSQL
else:
    engine = create_async_engine("sqlite:///./tag_diary.db")  # local dev
```

Alembic migrations own the schema in both environments. `create_all()` is never called in production.

### Endpoint Groups

```
/api/auth/          register, login, me, health
/api/users/         me (GET, PUT), password change
/api/vignettes/     CRUD, sort, file attachments
/api/photos/        CRUD, bulk upload, sort
/api/albums/        CRUD, add/remove photos, sort
/api/audio/         CRUD, in-browser recording support
/api/files/         CRUD, upload, download, full-text extract
/api/family-tree/   members CRUD, relationships CRUD
/api/timeline/      paginated feed, type filters
/api/search/        full-text search, tag filtering
/api/tags/          CRUD (admin-controlled creation)
/api/admin/         users, invite codes, background, file tools
```

### Auth Flow

```
1. POST /api/auth/register  { username, password, email, full_name, invite_code }
   → validate invite code (single-use, not expired)
   → hash password with bcrypt
   → create user record
   → mark invite code as used
   → return JWT token

2. POST /api/auth/login  { username, password }
   → verify bcrypt hash
   → return JWT token (expires 30 days)

3. All protected routes: Authorization: Bearer <token>
   → verify_token() → extract user_id
   → get_current_user dependency fetches user from DB
   → admin routes additionally check is_admin: true
```

---

## Storage Architecture

### Dual-Mode Storage

```
storage.py

upload_file(file_bytes, filename, content_type) → str (file_path/key)
delete_file(file_path)
get_file_url(file_path) → str (presigned URL or local path)
```

**Dev** (`USE_CLOUD_STORAGE` not set):
- Files written to `backend/uploads/<category>/<filename>`
- URLs returned as `/uploads/<category>/<filename>`
- Backend mounts `/uploads` as a static files directory

**Prod** (`USE_CLOUD_STORAGE=true`):
- Files uploaded to Cloudflare R2 bucket `gladneyfamilymemories`
- URLs returned as R2 presigned URLs (1 hour expiry)
- HEIC files converted to JPEG before upload (pillow-heif)
- Videos: 500MB max, no conversion

### File Categories in Storage

```
uploads/
  photos/         Original photo files
  photos/thumbs/  Thumbnails (800px max, generated on upload)
  audio/          Audio recordings
  files/          Documents and videos
  background/     Dashboard background images
```

---

## Database Schema (17 Tables)

```sql
users              id, username*, email, full_name, hashed_password,
                   is_admin, is_active, reset_token, reset_token_expires,
                   created_at

invite_codes       id, code*, email, created_by_id→users,
                   used_by_id→users, expires_at, created_at

vignettes          id, title, content (JSON/text), author_id→users,
                   sort_order, created_at, updated_at

vignette_photos    id, vignette_id→vignettes, photo_id→photos, position

photos             id, filename, file_path, title, description,
                   uploaded_by_id→users, taken_at, sort_order, created_at

albums             id, name, description, created_by_id→users,
                   sort_order, background_image, created_at

album_photos       id, album_id→albums, photo_id→photos, added_at

person             id, name

photo_person       id, photo_id→photos, person_id→person

audio_recordings   id, filename, file_path, title, description,
                   author_id→users, duration_seconds, created_at

files              id, filename, file_path, title, description, file_type,
                   source ("vignettes"|"files"), uploaded_by_id→users,
                   extracted_text (nullable), created_at

background_images  id, filename, file_path, uploaded_by_id→users,
                   is_active, created_at

family_members     id, first_name, last_name, birth_date, death_date, bio,
                   photo_id→photos, position_x, position_y,
                   created_by_id→users, created_at

family_relationships  id, person_a_id→family_members,
                      person_b_id→family_members,
                      relationship_type ("parent_child"|"spouse"|"sibling"),
                      created_at

tags               id, name*, category ("person"|"place"|"event"|"topic"),
                   created_at

content_tags       id, tag_id→tags, content_type ("vignette"|"photo"|"audio"|"file"),
                   content_id, created_at

* = unique constraint
```

---

## Deployment Topology

### GitHub Actions Pipelines

**`ci.yml`** — triggers on every push:
```
jobs:
  frontend-checks:
    - npm ci
    - npm run typecheck
    - npm run lint
    - npm run build
  backend-checks:
    - pip install -r requirements.txt
    - pytest (when tests exist)
```

**`deploy-frontend.yml`** — triggers on push to `main`:
```
- Build React app (npm run build → dist/)
- Push dist/ contents to gh-pages branch
- GitHub Pages serves at mrtag.com
```

**`deploy-backend.yml`** — triggers on push to `main`:
```
- Call Render deploy hook URL (webhook)
- Render runs: pip install && alembic upgrade head && uvicorn
```

**`backup.yml`** — weekly cron (Sundays at 03:00 UTC):
```
- pg_dump production DB → .sql.gz
- Upload to R2 bucket under backups/YYYY-MM-DD.sql.gz
- Delete backups older than 4 weeks
```

### Environment Variables

Set in Render dashboard (never committed to code):

```
# Required
DATABASE_URL            postgresql://user:pass@host:5432/dbname
SECRET_KEY              (auto-generated by Render)

# Storage
USE_CLOUD_STORAGE       true
S3_ENDPOINT_URL         https://<account>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID        (R2 API key)
S3_SECRET_ACCESS_KEY    (R2 API secret)
S3_BUCKET_NAME          gladneyfamilymemories

# Email (optional)
SMTP_HOST               smtp.gmail.com
SMTP_PORT               587
SMTP_USER               your@email.com
SMTP_PASSWORD           (app password)
FROM_EMAIL              noreply@mrtag.com
FROM_NAME               Gladney Family Tree
SITE_URL                https://mrtag.com

# Python
PYTHON_VERSION          3.11.0
```

Local dev (`.env` in `backend/`, gitignored):
```
# No DATABASE_URL → SQLite
# No USE_CLOUD_STORAGE → local uploads/
SECRET_KEY=dev-secret-key-change-in-prod
```

---

## Key Third-Party Library Decisions

| Library | Why chosen |
|---|---|
| **TanStack Query v5** | Best-in-class server state: caching, background refresh, optimistic updates, mutation lifecycle |
| **TipTap v2** | Most extensible headless rich text editor for React; stores output as JSON (portable, searchable) |
| **@xyflow/react v12** | Best React library for interactive node graphs; supports custom nodes, pan/zoom, edge types |
| **dagre** | Standard graph layout algorithm for hierarchical trees; integrates cleanly with React Flow |
| **@hello-pangea/dnd** | Maintained fork of react-beautiful-dnd; best DX for keyboard-accessible drag-and-drop |
| **Zustand v5** | Minimal boilerplate, no providers needed, localStorage persistence built-in |
| **shadcn/ui** | Not a component library — generates accessible Radix primitives you own; no version lock-in |
| **Tailwind v4** | `@theme` directive replaces `tailwind.config.js`; CSS-first config; faster build |
| **pillow-heif** | Only Python library that handles HEIC (iPhone photos) conversion cleanly |
| **cmdk** | Powers shadcn's Command component; battle-tested Cmd+K palette with keyboard nav |
| **Alembic** | Standard SQLAlchemy migration tool; `--autogenerate` diffs models against DB schema |
