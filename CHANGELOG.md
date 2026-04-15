# Changelog

All notable changes to the Gladney Family Tree project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [v2.0.0] — 2026-04-15

### Infrastructure
- **Database:** Migrated to Supabase Postgres (transaction-mode pooler, `prepare_threshold=None` for pgbouncer compatibility). Stores all relational data: users, vignettes, photos/audio/files metadata, tags, family tree.
- **Media storage:** Cloudflare R2 bucket `gladney-family-media` provisioned and wired via S3-compatible client. Stores all binary blobs (photos, audio, vignette media). Public URL served at `https://media.mrtag.com`.
- **Auth:** Remains custom JWT in FastAPI (`SECRET_KEY`) — Supabase is used only as the Postgres backend, not as an auth provider.
- Pushed full v2-redesign rewrite to repo: TypeScript + Tailwind + shadcn/ui frontend, feature-folder architecture, TanStack Query + zustand state.

---

## [v2.0.0-alpha.7] — 2026-03-16

### Fixed — Accessibility & Responsive Design
- Added `aria-label` to ~20 icon-only buttons across navbar, vignette cards, file cards, recording cards, photo modal, photo grid, album view, family tree detail panel, and invite codes panel
- Page header now stacks title/actions vertically on mobile (`flex-col sm:flex-row`)
- Family tree page uses responsive height (`min-h-[50vh] md:h-[calc(100vh-10rem)]`) instead of fixed calc
- Family tree detail panel renders full-width on mobile, side panel on desktop (`w-full md:w-80`)
- Timeline date filter inputs expand to full width on mobile (`w-full sm:w-36`)
- Audio and files grids use `sm:grid-cols-2` for earlier tablet breakpoint
- Admin grid uses `lg:grid-cols-2` for better single-column readability
- Photo modal image uses `max-h-[40vh] sm:max-h-[60vh]` to leave room for info panel on mobile
- Photo grid buttons include `aria-label` with photo title for screen readers
- Date inputs in filter bar include `aria-label` for accessibility

---

## [v2.0.0-alpha.6] — 2026-03-16

### Added — Milestone 6: Search, Tagging & Launch
- **Backend:** Tag model (name, category) and ContentTag model (polymorphic content tagging)
- **Backend:** LIKE-based search endpoint across vignettes, photos, audio, files
- **Backend:** 7 tag endpoints (CRUD tags, add/remove/get tags per content item)
- **Frontend:** Cmd+K command palette (shadcn Command / cmdk) with debounced search and page navigation
- **Frontend:** Search results page with type filter buttons and URL search params
- **Frontend:** TagInput component with autocomplete, create new tag, and remove badges
- **Frontend:** Tag input integrated into vignette, photo, audio, and file edit forms
- **Frontend:** React.lazy() + Suspense code splitting for all feature pages
- **Frontend:** Skeleton loading fallback for lazy-loaded routes
- **Frontend:** TagFilter component — toggleable tag pills for filtering content by tags
- **Frontend:** Tag filtering integrated into Timeline, Vignettes, and Photos pages
- **Frontend:** ErrorBoundary component wrapping all page content with reload action
- **Backend:** Search endpoint now accepts `tag_ids` param for tag-based filtering (works with or without search query)

---

## [v2.0.0-alpha.5] — 2026-03-16

### Added — Milestone 4: Timeline View
- Timeline page aggregating vignettes, photos, audio, and files chronologically
- Filter bar with content type toggles and date range inputs
- Year marker dividers between event groups
- Type-specific event cards with icons, badges, and photo thumbnails
- Custom Tailwind timeline (react-chrono incompatible with React 18)
- @tanstack/react-virtual installed for future long-list optimization

### Added — Milestone 5: Family Tree
- **Backend:** FamilyMember model (first/last name, birth/death dates, bio, photo link, position)
- **Backend:** FamilyRelationship model (parent_child, spouse, sibling types)
- **Backend:** 7 API endpoints (CRUD members, CRUD relationships, batch save layout)
- **Frontend:** React Flow (@xyflow/react) interactive canvas with custom FamilyMemberNode
- **Frontend:** dagre auto-layout with top-to-bottom generational hierarchy
- **Frontend:** Manual drag positioning with save/restore to database
- **Frontend:** Add/edit member dialog with name, dates, bio fields
- **Frontend:** Add relationship dialog with type selector and member dropdowns
- **Frontend:** Member detail side panel with photo, bio, relationship list, edit/delete actions
- **Frontend:** Edge styles by type: solid (parent-child), dashed (spouse), dotted (sibling)
- **Frontend:** zustand tree store for UI state (selection, dialogs)

### Added — Milestone 3 (continued)
- Dark mode toggle with zustand theme store + system preference detection
- Photo and album drag-and-drop arrange mode (@hello-pangea/dnd)
- Admin page composing user management, invite codes, background manager, file tools

---

## [v2.0.0-alpha.4] — 2026-03-15

### Added — Milestone 3: Admin Panel + Polish

**Admin Panel:**
- User management with inline username editing, admin/user badges, delete with confirmation
- Invite codes panel with create form (email, recipient, expiry, send option), active codes list, copy/delete
- Background image manager with upload/replace/remove
- File tools for detecting and fixing mistagged file sources

**Dark Mode:**
- Theme toggle button in navbar (sun/moon icons)
- zustand theme store with localStorage persistence
- System preference detection (prefers-color-scheme)
- Full dark mode color palette via CSS variables

**Drag-and-Drop Reordering:**
- Photo arrange mode with drag-and-drop grid (@hello-pangea/dnd)
- Album arrange mode with drag-and-drop cards
- Save/cancel flow with API reorder endpoints

**Toast Notifications:**
- Custom toast system with success/error/info variants
- Auto-dismiss after 4 seconds
- Used across all admin operations

---

## [v2.0.0-alpha.3] — 2026-03-15

### Added — Milestone 2: Core Content Pages

**Shared Components:**
- AuthenticatedImage — fetch image blob via API with loading/error states
- AuthenticatedAudio — fetch audio blob via API with native controls
- ConfirmDialog — reusable confirmation dialog replacing window.confirm()
- FileViewer — full-screen preview for images, video, audio, PDF, text files
- shadcn/ui: Dialog, Textarea, Select, DropdownMenu components

**Files Page:**
- File list with cards showing icon, title, description, date
- Multi-file upload with progress
- Inline editing of title and description
- File preview and download
- Admin-only: upload, edit, delete, download

**Vignettes Page:**
- Combined vignette + file list with 5 sort modes
- Vignette create/edit/view modal with photo selection
- Speech-to-text dictation (Web Speech API)
- File upload (source=vignettes) with inline metadata editing
- Inline date editing on vignettes
- File preview via FileViewer

**Audio Recordings Page:**
- Browser audio recording via MediaRecorder API
- Real-time audio level visualization bar
- Recording timer, preview, save/discard flow
- MIME type auto-detection (webm, ogg, mp4)
- Audio file upload
- Recording cards with AuthenticatedAudio player
- Inline metadata editing (title, description)

**Photo Gallery Page:**
- Photo grid sorted chronologically with hover overlay
- Full-size photo modal with inline title/date editing
- Album cards with background images
- Album detail view with photo grid
- Create album dialog
- Add/remove photos from albums
- Multi-file photo upload (parallel)

**TanStack Query Hooks:**
- useVignettes, useVignetteFiles, useRecordings, usePhotos, useAlbums
- All with create, update, delete mutations and automatic cache invalidation

---

## [v2.0.0-alpha.2] — 2026-03-15

### Added — Milestone 1: Foundation
- TypeScript configuration with `@/*` path aliases
- Tailwind CSS v4 with shadcn/ui color theme (light + dark mode CSS variables)
- shadcn/ui components: Button, Input, Label, Card, Skeleton, Separator, Badge
- TanStack Query v5 for server state management
- zustand auth store replacing React Context
- Typed API layer (`src/lib/api/`) with modules for all backend resources
- Feature-based folder structure (`src/features/`)
- App shell with responsive Navbar (mobile hamburger menu) and Footer
- Full login page with login, registration, forgot password, and reset password flows
- Dashboard page with stats grid and quick-link cards
- Protected route and admin route guards
- Placeholder pages for all routes (vignettes, photos, audio, files, admin, family-tree, timeline, search)
- Change password page
- Shared components: PageHeader, EmptyState
- Utility functions: `cn()` (tailwind-merge), date formatting helpers

### Changed
- Entry point moved from JSX to TSX (`main.tsx`, `App.tsx`)
- Build pipeline now runs TypeScript check before Vite build
- Package version bumped to 2.0.0-alpha.1

---

## [v2.0.0-alpha.1] — 2026-03-15

### Added
- Project documentation: CLAUDE.md, PROJECT_SPEC.md, ARCHITECTURE.md, CHANGELOG.md
- Development branch `v2-redesign` for frontend rebuild

### Planning
- Defined 6 milestones for v2 rebuild
- Selected tech stack: TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query/Router, zustand
- Designed feature-based folder structure
- Planned 3 new features: family tree visualization, timeline view, search & tagging
