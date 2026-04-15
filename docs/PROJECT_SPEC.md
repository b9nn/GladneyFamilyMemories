# Project Spec — Gladney Family Tree v2

## Main Goal
Rebuild the Gladney Family Tree frontend with a modern, beautiful UI using shadcn/ui + Tailwind CSS, while preserving all existing functionality and adding three major new features: family tree visualization, timeline view, and search/tagging.

## Success Criteria
- [ ] All existing features work with the new UI (full parity with v1)
- [ ] Responsive design that works well on mobile, tablet, and desktop
- [ ] Dark mode support
- [ ] Interactive family tree visualization
- [ ] Chronological timeline view of all memories
- [ ] Full-text search across all content types with tagging system
- [ ] TypeScript throughout the frontend (no untyped code)
- [ ] Loading states, error handling, and toast notifications everywhere

---

## Milestones

### Milestone 1: Foundation
**Status:** Complete
**Goal:** New project infrastructure compiles and runs with a working login page.

Deliverables:
- [x] Branch `v2-redesign` created
- [x] Documentation files created (CLAUDE.md, PROJECT_SPEC.md, ARCHITECTURE.md, CHANGELOG.md)
- [x] TypeScript configured
- [x] Tailwind CSS v4 installed and configured
- [x] shadcn/ui initialized with core components
- [x] TanStack Query + zustand set up
- [x] Typed API layer created (`src/lib/api/`)
- [x] App shell built (Navbar, Footer, layout)
- [x] Login page rebuilt and functional
- [x] Auth flow working (login, token persistence, protected routes)

### Milestone 2: Core Content Pages
**Status:** Complete
**Goal:** All existing content pages rebuilt with new UI and full feature parity.

Deliverables:
- [x] Dashboard page (stats, welcome, quick links)
- [x] Vignettes page (create, edit, delete, sort, photo embedding, speech dictation, file management)
- [x] Photo Gallery (upload, albums, grid view, modal viewer, album CRUD)
- [x] Audio Recordings (browser recording, upload, playback, metadata editing, audio level viz)
- [x] Files page (upload, download, list, inline editing, preview)
- [x] Change Password page
- [x] Shared components (AuthenticatedImage, AuthenticatedAudio, ConfirmDialog, FileViewer, EmptyState, PageHeader)
- [x] Drag-and-drop reordering (completed in Milestone 3)

### Milestone 3: Admin Panel + Polish
**Status:** Complete
**Goal:** Admin features rebuilt, app polished for production quality.

Deliverables:
- [x] Admin Panel (invite codes, user management, background images, file tools)
- [x] Loading skeletons on all pages
- [x] Toast notifications replacing all alert()/confirm() calls
- [x] Dark mode with theme toggle (zustand store, system preference detection)
- [x] Drag-and-drop reordering for photos and albums (@hello-pangea/dnd)
- [x] Error boundaries for graceful error handling
- [x] Responsive design audit (mobile-first)
- [x] Accessibility pass (keyboard nav, ARIA labels, focus management)

### Milestone 4: Timeline View
**Status:** Complete
**Goal:** New chronological timeline feature showing all family memories.

Deliverables:
- [x] Timeline page with vertical layout (custom Tailwind, react-chrono incompatible with React 18)
- [x] Year markers and event cards for each content type
- [x] Filter bar (by content type, date range)
- [x] @tanstack/react-virtual installed for future performance optimization
- [x] Navigation link (already wired in M1)

### Milestone 5: Family Tree
**Status:** Complete
**Goal:** Interactive family tree diagram that users can build and explore.

Deliverables:
- [x] Backend: FamilyMember and FamilyRelationship models
- [x] Backend: 7 CRUD API endpoints
- [x] Frontend: React Flow (@xyflow/react) canvas with custom nodes and edges
- [x] Add/edit/delete family members via dialog forms
- [x] Add/remove relationships (parent-child, spouse, sibling)
- [x] Auto-layout with dagre + manual drag positioning + save positions
- [x] Person detail sidebar panel with relationship list
- [x] Link members to existing photos (photo_id field)

### Milestone 6: Search, Tagging & Launch
**Status:** Complete
**Goal:** Full-text search and tagging system. Production deployment of v2.

Deliverables:
- [x] Backend: Tag and ContentTag models
- [x] Backend: LIKE-based search across all content types (PostgreSQL full-text search for future optimization)
- [x] Backend: /api/search endpoint + 7 tag CRUD endpoints
- [x] Frontend: Global Cmd+K search dialog (shadcn Command / cmdk)
- [x] Frontend: Search results page with type filters
- [x] Frontend: Tag input on vignette, photo, audio, file edit forms
- [x] Frontend: Filter-by-tag on gallery, vignettes, and timeline
- [x] Production build optimization (code splitting with React.lazy + Suspense)
- [ ] Deploy to Fly.io + GitHub Pages
- [x] CHANGELOG.md updated with v2.0.0 release notes
