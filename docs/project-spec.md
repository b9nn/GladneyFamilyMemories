# Gladney Family Tree — Project Spec
> Version: 0.1 | Last updated: 2026-03-23

---

## Vision

A private, invite-only web app that lets the Gladney family preserve and share their memories together. Family members can contribute written stories, photos, videos, audio recordings, and documents — organized by a family tree, browsable on a timeline, and searchable from a global palette.

**URL**: mrtag.com
**Audience**: ~10–50 family members (medium scale)
**Access**: Fully private — login required for all content

---

## Core Features (10 Pages)

| # | Page | Description |
|---|---|---|
| 1 | **Login / Register** | JWT auth, invite-code gated registration, password change |
| 2 | **Dashboard** | Stats, quick links, background image set by admin |
| 3 | **Vignettes** | Full rich-text stories (TipTap), file attachments, sortable, taggable |
| 4 | **Photo Gallery** | Albums + loose photos, bulk upload, drag-to-reorder, modal viewer, HEIC support |
| 5 | **Audio Recordings** | In-browser recording + file upload, playback with optional waveform |
| 6 | **Files** | Document + video uploads, inline preview, download, full-text search indexing |
| 7 | **Family Tree** | Interactive node graph (React Flow), add members, connect relationships, auto-layout |
| 8 | **Timeline** | Chronological feed of all memory types, filterable by content type |
| 9 | **Search** | Global Cmd+K palette, full-text search including document content, tag filtering |
| 10 | **Admin Panel** | User management, invite codes, promote to admin, background image, file tools |

---

## Milestones

### M1 — Foundation
*Everything else depends on this. Ship nothing visible until M1 is complete.*

**M1.1 — Backend infrastructure**
- [ ] `database.py` — dual-mode SQLite (dev) / PostgreSQL (prod)
- [ ] `models.py` — all 17 SQLAlchemy models
- [ ] `schemas.py` — all Pydantic request/response schemas
- [ ] `auth.py` — JWT token creation, verification, `get_current_user`, `get_current_admin_user`
- [ ] `storage.py` — dual-mode local fs (dev) / Cloudflare R2 (prod), HEIC conversion
- [ ] `email.py` — SMTP admin notifications (new registrations)
- [ ] Alembic setup + initial migration (captures full schema)
- [ ] `requirements.txt` with all dependencies pinned

**M1.2 — Backend API endpoints**
- [ ] Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- [ ] Users: `GET /api/users/me`, `PUT /api/users/me/password`
- [ ] Stubs for all remaining endpoint groups (to unblock frontend)

**M1.3 — Frontend scaffold**
- [ ] Vite 5 + TypeScript 5 (strict) + Tailwind v4 init
- [ ] shadcn/ui init + base components (button, card, dialog, input, label, select, textarea, badge, skeleton, command, separator, dropdown-menu)
- [ ] App shell: providers (QueryClient, Router, AuthContext), layout, protected routes
- [ ] Navbar + footer components
- [ ] `src/lib/api/client.ts` — axios instance with JWT interceptor + 401 redirect
- [ ] All API client modules stubbed: `auth.ts`, `vignettes.ts`, `photos.ts`, `albums.ts`, `audio.ts`, `files.ts`, `admin.ts`, `family-tree.ts`, `search.ts`
- [ ] `src/types/api.ts` — all shared TypeScript interfaces

**M1.4 — Auth flow**
- [ ] Login page + form with validation
- [ ] Register page (invite-code field)
- [ ] Auth store (Zustand): token, user, login(), logout()
- [ ] Protected route wrapper
- [ ] Change password page

---

### M2 — Core Pages
*Parallelizable — each page is independent after M1.*

**M2.1 — Dashboard**
- [ ] Stats cards (total vignettes, photos, members, recordings)
- [ ] Quick-link cards to all sections
- [ ] Background image display (fetched from admin setting)

**M2.2 — Vignettes**
- [ ] Vignette list with sort controls
- [ ] TipTap rich text editor (full: bold, italic, headings, lists, links)
- [ ] File attachments per vignette
- [ ] Tag assignment (predefined categories)
- [ ] Vignette modal (read view)
- [ ] Create / edit / delete with optimistic updates

**M2.3 — Photo Gallery**
- [ ] Loose photos grid view + modal viewer
- [ ] Album list → album detail view
- [ ] Bulk upload with HEIC conversion
- [ ] Drag-to-reorder within albums (@hello-pangea/dnd)
- [ ] Create / edit / delete albums
- [ ] Add/remove photos from albums

**M2.4 — Audio Recordings**
- [ ] Recording list
- [ ] In-browser recorder (MediaRecorder API)
- [ ] File upload
- [ ] Playback controls (optional waveform via wavesurfer.js if clean)
- [ ] Create / edit / delete

**M2.5 — Files**
- [ ] File list (documents + videos)
- [ ] Upload (any file type, 500MB max for video)
- [ ] Inline preview (PDF, video playback)
- [ ] Download
- [ ] Full-text extraction for PDFs (stored for search indexing)

---

### M3 — Advanced Features
*Parallelizable after M2.*

**M3.1 — Admin Panel**
- [ ] User table (view all users, activate/deactivate, promote to admin)
- [ ] Invite codes panel (create, list, revoke)
- [ ] Background image upload + set active
- [ ] File tools (storage usage, orphan cleanup)

**M3.2 — Family Tree**
- [ ] React Flow canvas with pan/zoom
- [ ] Custom member nodes (name, photo, dates)
- [ ] Dagre auto-layout
- [ ] Add/edit/delete family members
- [ ] Add/edit/delete relationships (parent_child, spouse, sibling)
- [ ] Member detail side panel

**M3.3 — Timeline**
- [ ] Chronological feed of all content types
- [ ] Filter toggles: vignettes, photos, audio, files
- [ ] Date range filter
- [ ] Infinite scroll or pagination

**M3.4 — Search + Tagging**
- [ ] Global Cmd+K command palette (shadcn Command)
- [ ] Full-text search across titles, descriptions, vignette content, extracted document text
- [ ] Tag filter panel
- [ ] Tag CRUD (admin-only creation, all users can assign)
- [ ] Results grouped by content type

---

### M4 — Polish
*Sequential after M3.*

**M4.1 — Theme + Dark Mode**
- [ ] CSS custom properties for light/dark tokens in `globals.css`
- [ ] Theme store (Zustand, localStorage-persisted)
- [ ] System preference detection + user override
- [ ] Theme toggle component in navbar
- [ ] Verify dark mode works on every page

**M4.2 — PWA**
- [ ] `manifest.json` (name, icons, theme_color, display: standalone)
- [ ] Service worker (Vite PWA plugin or manual) for offline shell
- [ ] Install prompt handling

**M4.3 — Loading States**
- [ ] Skeleton components on every page (replace spinners)
- [ ] Suspense boundaries for lazy-loaded pages

**M4.4 — Toast Notifications**
- [ ] Replace all `alert()` / `window.confirm()` with shadcn Toast
- [ ] Success + error toasts on all mutations

**M4.5 — Error Boundaries**
- [ ] Top-level error boundary
- [ ] Per-feature error boundaries with retry

**M4.6 — Responsive Design**
- [ ] Audit all pages at 375px, 768px, 1280px
- [ ] Mobile navigation (hamburger / bottom nav)

**M4.7 — Accessibility**
- [ ] Keyboard navigation on all interactive elements
- [ ] ARIA labels on icon-only buttons
- [ ] Focus management in modals

---

### M5 — Deploy
*Final phase.*

**M5.1 — CI/CD (GitHub Actions)**
- [ ] `.github/workflows/ci.yml` — on every push: typecheck, lint, build, pytest
- [ ] `.github/workflows/deploy-frontend.yml` — on push to main: build → gh-pages branch
- [ ] Render deploy hook triggered from CI on push to main

**M5.2 — Infrastructure Setup**
- [ ] Cloudflare R2 bucket created + API keys generated
- [ ] PostgreSQL provisioned on Render
- [ ] Render web service created (backend)
- [ ] Environment variables set in Render dashboard
- [ ] Initial Alembic migration run against production DB

**M5.3 — Production Smoke Test**
- [ ] Frontend loads at mrtag.com
- [ ] Login works
- [ ] Upload a photo → verify it appears in R2
- [ ] Create a vignette → verify it persists
- [ ] Admin panel accessible

**M5.4 — Backup Automation**
- [ ] `.github/workflows/backup.yml` — weekly cron: pg_dump → gzip → upload to R2 `backups/` prefix, retain last 4

---

## Out of Scope (Deliberately Not Building Yet)

- Family tree ↔ memory linking (click member → see their photos/vignettes)
- Public-facing landing page (everything is behind login)
- AI-powered semantic search
- Commenting on vignettes/photos
- Free-form user tags (admin controls all tags)
- Real-time notifications (WebSockets/SSE)
- Multi-language support

---

## Success Criteria

- [ ] All 10 pages render and function correctly
- [ ] TypeScript strict mode passes with zero errors
- [ ] ESLint passes with zero errors (warnings OK for shadcn/ui)
- [ ] Production build succeeds under 500KB gzipped for main bundle
- [ ] Dark mode works everywhere
- [ ] Mobile-responsive on all pages
- [ ] Cmd+K search works across all content types
- [ ] Family tree renders, supports CRUD, auto-layouts with dagre
- [ ] Timeline shows all memory types chronologically with type filters
- [ ] Tag filtering works on vignettes, photos, and timeline
- [ ] Drag-and-drop reordering works for photos in albums
- [ ] Auth flow works (login, register with invite code, password change)
- [ ] Admin panel manages users, invites, background images
- [ ] File uploads (including video) persist to Cloudflare R2 in production
- [ ] HEIC photos are automatically converted on upload
- [ ] Database migrations run cleanly via Alembic
- [ ] CI pipeline catches errors before deploy
- [ ] Frontend auto-deploys to GitHub Pages on push to main
- [ ] Backend auto-deploys to Render on push to main
- [ ] Production DB is backed up weekly to R2
