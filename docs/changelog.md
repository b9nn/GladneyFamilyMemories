# Changelog
All notable changes to Gladney Family Tree will be documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: Milestone-based (M1 = v0.1.0, M2 = v0.2.0, etc.)

---

## [Unreleased]

---

## [v0.5.0] — M5: Deployment — 2026-03-23

### Added
- `render.yaml` — full Render deployment spec: web service + PostgreSQL database + 10 GB persistent disk
- `.github/workflows/ci.yml` — GitHub Actions CI: frontend typecheck + lint + build, backend import check + pytest
- `.github/workflows/deploy.yml` — GitHub Actions auto-deploy to Render on push to `main` via deploy hook
- FastAPI SPA fallback: serves `frontend/dist/` in production, catch-all returns `index.html` for client-side routing
- Root `.gitignore` — covers Python, Node, macOS, IDE artifacts

## [v0.4.0] — M4: Polish — 2026-03-23

### Added
- Toast notification system (Zustand store, auto-dismiss 4s, success/error/info)
- Global mutation error handler in QueryClient — all failed mutations show an error toast
- Error boundary wrapping all page routes with "Try again" reset
- Mobile-responsive Navbar with animated hamburger menu
- PWA: `manifest.json` + `sw.js` service worker (network-first API, cache-first assets)
- Code splitting: all 12 page components lazy-loaded via `React.lazy` + `Suspense`

## [v0.3.0] — M3: Advanced Features — 2026-03-23

### Added
- Admin panel: user management (toggle admin/active), invite code generator + copy, background image upload
- Family Tree: interactive ReactFlow canvas with dagre auto-layout, add/edit/delete members, color-coded relationship edges
- Timeline: chronological feed of all content types with type-filter chips
- Search: live full-text search (≥2 chars), results with type icons + snippets

## [v0.2.0] — M2: Core Pages — 2026-03-23

### Added
- Dashboard: stat cards (counts for all content types) + background image display
- Vignettes: TipTap v3 rich-text editor, CRUD, HTML preview cards
- Photos: drag-and-drop + click upload (HEIC via backend conversion), photo grid, full-screen lightbox
- Audio: in-browser MediaRecorder recording + file upload, audio player, duration display
- Files: file upload, download links, file-type icons

## [v0.1.0] — M1: Foundation — 2026-03-23

### Added
- `CLAUDE.md` — project conventions, stack, dev commands, gotchas
- `docs/project-spec.md` — vision, milestones, success criteria
- `docs/architecture.md` — system design, DB schema, deployment topology
- `.claude/settings.json` — MCP servers (postgres, github), hooks, permissions
- `.claude/commands/` — 7 custom slash commands
- Backend: FastAPI + SQLAlchemy 2.0, 17 models, full CRUD API, JWT auth, dual-mode storage (local/R2), HEIC conversion, Alembic initial migration
- Frontend: React 18 + TypeScript strict + Tailwind v4 + TanStack Query v5 + Zustand v5 + React Router v6
- Auth flow: login, register, change password, protected routes, Zustand auth store
- All 9 feature placeholder pages + shared Layout, Navbar, PageHeader, EmptyState

---

## [0.1.0] — Foundation (M1) — TBD

### Added
**Backend**
- `backend/app/database.py` — dual-mode SQLite/PostgreSQL engine
- `backend/app/models.py` — 17 SQLAlchemy ORM models
- `backend/app/schemas.py` — Pydantic v2 request/response schemas
- `backend/app/auth.py` — JWT token create/verify, get_current_user, get_current_admin_user
- `backend/app/storage.py` — dual-mode R2/local storage, HEIC conversion
- `backend/app/email.py` — SMTP admin notifications
- `backend/app/main.py` — FastAPI app, CORS, auth endpoints
- `backend/alembic/` — Alembic setup + initial migration
- `backend/requirements.txt` — pinned dependencies
- `backend/run.py` — uvicorn dev entry point

**Frontend**
- Vite 5 + TypeScript 5 (strict) + Tailwind v4 scaffold
- shadcn/ui init + base components
- App shell: providers, router, protected routes, layout
- `src/lib/api/client.ts` — axios instance with JWT interceptor
- All API client modules stubbed
- `src/types/api.ts` — shared TypeScript interfaces
- Login page + form
- Register page with invite-code field
- Auth store (Zustand)
- Change password page

---

## [0.2.0] — Core Pages (M2) — TBD

### Added
- Dashboard page (stats, quick links, background image)
- Vignettes page (TipTap editor, file attachments, tags, sort)
- Photo Gallery (loose photos + albums, bulk upload, HEIC, drag-to-reorder)
- Audio Recordings (in-browser recorder + upload, playback)
- Files page (documents + video, inline preview, download)

---

## [0.3.0] — Advanced Features (M3) — TBD

### Added
- Admin Panel (user management, invite codes, background image, file tools)
- Family Tree (React Flow canvas, member CRUD, relationship CRUD, dagre layout)
- Timeline (chronological feed, type filters, date range)
- Search + Tagging (Cmd+K palette, full-text search, tag filtering)

---

## [0.4.0] — Polish (M4) — TBD

### Added
- Dark mode (system preference + user override, theme toggle)
- PWA (manifest.json, service worker, install prompt)
- Loading skeletons on all pages
- Toast notifications replacing all alert/confirm
- Error boundaries (top-level + per-feature)
- Responsive design (mobile-friendly at 375px+)
- Accessibility pass (keyboard nav, ARIA labels, focus management)

---

## [1.0.0] — Production Deploy (M5) — TBD

### Added
- GitHub Actions CI (typecheck, lint, build, pytest on every push)
- GitHub Actions deploy-frontend (build → gh-pages on push to main)
- GitHub Actions backup (weekly pg_dump → R2)
- Render deploy hook trigger from CI
- Production infrastructure (Cloudflare R2, Render PostgreSQL, Render web service)
- Initial Alembic migration run against production DB
- Production smoke test passed
