# CLAUDE.md — Project Rules for Claude-Assisted Development

## Project Overview
Gladney Family Tree (mrtag.com) — A private family memories web app.
- **Backend:** FastAPI (Python) + PostgreSQL + Cloudflare R2 — lives in `backend/`
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui — lives in `frontend/`
- **Branch:** `v2-redesign` is the active development branch

## Development Commands
```bash
# Backend
cd backend && python run.py          # Starts on localhost:8000

# Frontend
cd frontend && npm run dev           # Starts on localhost:3000 (proxies /api to :8000)
cd frontend && npm run build         # Production build
cd frontend && npm run typecheck     # TypeScript validation
cd frontend && npm run lint          # ESLint check
```

## Code Rules

### Styling
- Always use Tailwind utility classes. Never use inline styles or raw CSS.
- Use the `cn()` utility from `src/lib/utils/cn.ts` for conditional classes.
- Follow shadcn/ui patterns for all UI components.

### TypeScript
- All new frontend files must be TypeScript (`.ts` / `.tsx`).
- Define types in the relevant feature's `types.ts` or in `src/types/` for shared types.
- No `any` types unless absolutely necessary (and add a comment explaining why).

### Components
- Keep page components under 200 lines. Extract sub-components into feature `components/` folders.
- Each feature lives in `src/features/<name>/` with `components/`, `hooks/`, and `page.tsx`.
- Shared components go in `src/components/shared/`.
- shadcn/ui components live in `src/components/ui/` (auto-generated, don't manually edit).

### API & Data Fetching
- All API calls go through the typed API layer in `src/lib/api/`.
- Use TanStack Query hooks for all server state (no raw useState + useEffect for fetching).
- Mutations must invalidate relevant query keys on success.

### State Management
- Server state: TanStack Query (queries + mutations)
- Client state: zustand stores in feature `stores/` folders
- No React Context for new state (legacy AuthContext migrated to zustand)

### Backend
- Backend changes are minimal — only for new features (family tree, search/tagging).
- New models go in `backend/app/models.py`, new endpoints in `backend/app/main.py`.
- Follow existing patterns (SQLAlchemy models, Pydantic schemas, dependency injection).

## Documentation Updates (Automatic)
When completing a feature or milestone:
1. Update `CHANGELOG.md` with what was added/changed/fixed
2. Update `docs/ARCHITECTURE.md` if the architecture changed
3. Update `docs/PROJECT_SPEC.md` milestone status (mark complete)

## File Structure Reference
```
frontend/src/
  app/              # Layout, router, providers
  components/
    ui/             # shadcn/ui (auto-generated)
    shared/         # App-wide shared components
  features/
    auth/           # Login, register, password
    dashboard/      # Home page
    vignettes/      # Written stories
    photos/         # Gallery, albums
    audio/          # Recordings
    files/          # Document uploads
    admin/          # Admin panel
    family-tree/    # Family tree visualization
    timeline/       # Chronological memory view
    search/         # Global search + tagging
  lib/
    api/            # Typed API client + modules
    utils/          # Helpers (cn, date, etc.)
  types/            # Shared TypeScript types
```

## Git Conventions
- Commit messages: imperative mood, concise (e.g., "Add vignette card component")
- One logical change per commit
- Keep `v2-redesign` branch up to date with `main` via rebase
