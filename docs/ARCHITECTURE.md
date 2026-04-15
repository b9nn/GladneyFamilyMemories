# Architecture — Gladney Family Tree v2

## System Overview

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│        React 18 + Vite + TypeScript              │
│     Tailwind CSS + shadcn/ui + TanStack          │
│                                                  │
│  Hosted: GitHub Pages (mrtag.com)                │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS /api/*
┌──────────────────────▼──────────────────────────┐
│                   Backend                        │
│           FastAPI (Python 3.11)                   │
│     SQLAlchemy ORM + JWT Authentication           │
│                                                  │
│  Hosted: Render (gladney-family-backend)          │
└───────┬──────────────────────────┬──────────────┘
        │                          │
┌───────▼──────────┐    ┌─────────▼────────────┐
│   PostgreSQL     │    │   Cloudflare R2      │
│   (Render)       │    │   (S3-compatible)    │
│   User data,     │    │   Photos, audio,     │
│   content, tags  │    │   files, backgrounds │
└──────────────────┘    └──────────────────────┘
```

## Tech Stack

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 | UI rendering |
| Build | Vite 5 | Dev server + bundling |
| Language | TypeScript 5.5 | Type safety |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Components | shadcn/ui (Radix) | Accessible UI primitives |
| Server State | TanStack Query v5 | Caching, fetching, mutations |
| Routing | TanStack Router v1 | Type-safe file routing |
| Client State | zustand v5 | Auth, UI preferences |
| Drag & Drop | @hello-pangea/dnd | Content reordering |
| Visualization | @xyflow/react v12 | Family tree diagram |
| Icons | lucide-react | Icon library |
| Validation | zod | Schema validation |
| HTTP | axios | API client |
| Dates | date-fns | Date formatting |

### Backend (unchanged from v1)
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | FastAPI | Async Python web framework |
| ORM | SQLAlchemy 2.0 | Database access |
| Database | PostgreSQL | Data persistence |
| Auth | python-jose (JWT) | Token authentication |
| Storage | boto3 (S3/R2) | Cloud file storage |
| Images | Pillow + pillow-heif | Image processing |
| Email | smtplib | SMTP notifications |

## Frontend Architecture

### Folder Structure
```
frontend/src/
│
├── app/                        # Application shell
│   ├── layout.tsx              # Root layout (nav, footer, background)
│   ├── router.tsx              # TanStack Router configuration
│   └── providers.tsx           # QueryClient, Auth, Theme providers
│
├── components/
│   ├── ui/                     # shadcn/ui generated (DO NOT EDIT)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   └── shared/                 # App-wide shared components
│       ├── authenticated-image.tsx
│       ├── authenticated-audio.tsx
│       ├── confirm-dialog.tsx
│       ├── empty-state.tsx
│       ├── page-header.tsx
│       └── error-boundary.tsx
│
├── features/                   # Feature modules
│   ├── auth/
│   │   ├── components/         # LoginForm, RegisterForm
│   │   ├── hooks/              # useAuth
│   │   ├── stores/             # auth-store.ts (zustand)
│   │   └── types.ts
│   ├── dashboard/
│   │   ├── components/         # StatsGrid, RecentActivity
│   │   └── page.tsx
│   ├── vignettes/
│   │   ├── components/         # VignetteCard, VignetteModal, Editor
│   │   ├── hooks/              # useVignettes (TanStack Query)
│   │   └── page.tsx
│   ├── photos/
│   │   ├── components/         # PhotoGrid, AlbumCard, PhotoUpload
│   │   ├── hooks/              # usePhotos, useAlbums
│   │   └── page.tsx
│   ├── audio/
│   │   ├── components/         # RecordingCard, Recorder, AudioPlayer
│   │   ├── hooks/              # useRecordings
│   │   └── page.tsx
│   ├── files/
│   │   ├── components/         # FileList, FileUpload
│   │   ├── hooks/              # useFiles
│   │   └── page.tsx
│   ├── admin/
│   │   ├── components/         # InviteCodesPanel, UserManagement
│   │   ├── hooks/              # useAdmin
│   │   └── page.tsx
│   ├── family-tree/            # NEW FEATURE
│   │   ├── components/         # TreeCanvas, PersonNode, RelationshipEdge
│   │   ├── hooks/              # useFamilyTree
│   │   ├── stores/             # tree-store.ts
│   │   └── page.tsx
│   ├── timeline/               # NEW FEATURE
│   │   ├── components/         # TimelineView, TimelineEvent, FilterBar
│   │   ├── hooks/              # useTimeline
│   │   └── page.tsx
│   └── search/                 # NEW FEATURE
│       ├── components/         # SearchBar, SearchResults, TagInput
│       ├── hooks/              # useSearch
│       └── page.tsx
│
├── lib/
│   ├── api/                    # Typed API layer
│   │   ├── client.ts           # Axios instance + interceptors
│   │   ├── auth.ts             # Auth endpoints
│   │   ├── vignettes.ts        # Vignette endpoints
│   │   ├── photos.ts           # Photo endpoints
│   │   ├── albums.ts           # Album endpoints
│   │   ├── audio.ts            # Audio endpoints
│   │   ├── files.ts            # File endpoints
│   │   ├── admin.ts            # Admin endpoints
│   │   ├── family-tree.ts      # Family tree endpoints (NEW)
│   │   └── search.ts           # Search endpoints (NEW)
│   └── utils/
│       ├── cn.ts               # clsx + tailwind-merge
│       └── date.ts             # Date formatting helpers
│
├── types/
│   └── api.ts                  # Shared API response types
│
└── styles/
    └── globals.css             # Tailwind directives + CSS variables
```

### Data Flow Pattern
```
User Action
    │
    ▼
Page Component (< 200 lines)
    │
    ├── Uses TanStack Query hook (e.g., useVignettes())
    │       │
    │       ▼
    │   Typed API function (e.g., vignettesApi.list())
    │       │
    │       ▼
    │   Axios client (adds JWT header automatically)
    │       │
    │       ▼
    │   FastAPI backend → PostgreSQL / R2
    │
    ├── Uses zustand store (e.g., useAuthStore())
    │       │
    │       ▼
    │   Local client state (token, user, UI prefs)
    │
    └── Renders shadcn/ui components with Tailwind classes
```

### Authentication Flow
```
App Mount
    │
    ├── Check zustand store for token in localStorage
    │
    ├── If token exists → call GET /api/auth/me
    │   ├── Success → user authenticated, store user data
    │   └── Failure → clear token, redirect to /login
    │
    └── TanStack Router beforeLoad guard
        ├── Protected route + no auth → redirect /login
        └── Admin route + not admin → redirect /
```

## Database Schema (v2 additions)

### Existing Models (unchanged)
User, Vignette, Photo, AudioRecording, File, Album, AlbumPhoto, VignettePhoto, InviteCode, Person, PhotoPerson, BackgroundImage

### New Models (Milestone 5: Family Tree)
```
FamilyMember
├── id, first_name, last_name
├── birth_date, death_date
├── bio (text)
├── photo_id → Photo (portrait)
├── created_by_id → User
├── position_x, position_y (React Flow positioning)
└── created_at

FamilyRelationship
├── id
├── person_a_id → FamilyMember
├── person_b_id → FamilyMember
├── relationship_type (parent_child | spouse | sibling)
└── created_at
```

### New Models (Milestone 6: Search & Tagging)
```
Tag
├── id, name (unique)
├── category (person | place | event | topic)
└── created_at

ContentTag
├── id
├── tag_id → Tag
├── content_type (vignette | photo | audio | file)
├── content_id
└── created_at
```

## API Endpoints

### Existing (60+ endpoints) — see backend/app/main.py
All existing endpoints remain unchanged.

### New Endpoints (Milestone 5)
- `GET /api/family-tree` — All members + relationships
- `POST /api/family-members` — Create member
- `PUT /api/family-members/{id}` — Update member
- `DELETE /api/family-members/{id}` — Delete member
- `POST /api/family-relationships` — Create relationship
- `DELETE /api/family-relationships/{id}` — Delete relationship
- `POST /api/family-tree/layout` — Save node positions

### New Endpoints (Milestone 6)
- `GET /api/search?q=&type=&tags=` — Full-text search
- `GET /api/tags` — List tags
- `POST /api/tags` — Create tag
- `POST /api/{content_type}/{id}/tags` — Add tag to content
- `DELETE /api/{content_type}/{id}/tags/{tag_id}` — Remove tag

## Design Decisions

### Clean rewrite over incremental migration
The v1 frontend uses 100% inline styles with no component library. Converting inline styles to Tailwind one-by-one is more error-prone than rebuilding each page from scratch against the same API.

### TanStack Query over manual fetch/setState
Every v1 page follows the pattern: useState + useEffect + try/catch + manual refetch. TanStack Query eliminates this boilerplate and adds caching, background refetching, and optimistic updates.

### zustand over React Context
The new features (search state, family tree selection, UI preferences) need more scalable state management. zustand provides selector-based subscriptions without the re-render issues of Context.

### React Flow over D3.js for family tree
React Flow provides pan/zoom canvas, node/edge management, and layout algorithms as React components. D3 would require imperative DOM manipulation that doesn't compose well with React.

### TanStack Router over react-router-dom
Type-safe routes, built-in search params handling, and loader patterns. The new search/filter features benefit from URL-driven state.
