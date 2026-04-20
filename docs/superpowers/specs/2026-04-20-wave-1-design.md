# Wave 1 — Design Spec

> Date: 2026-04-20
> Status: Approved (pending user review of this document)

Wave 1 ships six independent, low-risk improvements to mrtag.com. Each is its own commit + auto-deploy so we can react and tweak between rolls.

## Ship order

1. **D1** — SMTP setup walkthrough *(no dependencies)*
2. **U3** — Password reset flow *(depends on D1: requires SMTP working)*
3. **S1** — Cmd-K global search *(no dependencies)*
4. **P1** — Photo lightbox *(no dependencies)*
5. **Q2** — Thumbnail variants *(no dependencies; lightbox benefits from it)*
6. **F1** — Family tree layout *(no dependencies)*

Order rationale: D1 unblocks U3. S1/P1/Q2/F1 are independent — sequenced so that fast user-facing wins (search, lightbox) ship before backend-heavy work (thumbnail backfill, layout swap).

---

## D1 — SMTP Setup Walkthrough

### Goal
Make the existing `/admin → SMTP config` page actually usable for a non-technical admin. Today the form takes raw values with no guidance, and the test button has weak feedback.

### Changes
- **Frontend (`AdminPage.tsx` SMTP section):**
  - Add a **"Use Gmail (recommended)" preset button** that pre-fills `smtp_host=smtp.gmail.com`, `smtp_port=587`. User still types `smtp_user`, `smtp_password`, `from_email`.
  - Add an **expandable "How to get a Gmail app password"** disclosure with the 5 steps (link to `myaccount.google.com → Security → 2-Step Verification → App passwords`). Inline instructions, no external doc.
  - **Move the "Send test email" button to a prominent position** at the top of the section, with a clearer label ("Send a test email to verify it works").
  - **Improve test-email feedback:** show success toast with the recipient address; on failure, show the actual SMTP error message (not just "failed").
- **Backend (`POST /api/admin/smtp-config/test`):**
  - Catch `smtplib.SMTPException` and return `{detail: "<error message>"}` with status 400 instead of letting it 500.
  - Currently returns 500 if `send_email()` returns False — change to 400 with the printed `[EMAIL] Failed: ...` message bubbled up.

### Acceptance criteria
- An admin who has never used SMTP before can configure Gmail and send a test email in under 3 minutes following only the on-page guidance.
- If credentials are wrong, the error toast shows the actual SMTP rejection reason (e.g. "Username and Password not accepted").

### Out of scope
- SendGrid / Mailgun presets (Gmail covers the common case; advanced users can fill the form manually).
- OAuth-based Gmail flow.

---

## U3 — Password Reset Flow

### Goal
Let users reset a forgotten password without admin intervention. DB columns `users.reset_token` and `users.reset_token_expires` already exist; no UI or endpoints currently use them.

### Hard dependency
SMTP must be working in production (D1). Reset flow is gated on it.

### Backend
Two new endpoints:

**`POST /api/auth/forgot-password`**
- Body: `{ email: str }`
- Look up user by email (`users.email`). If found:
  - Generate 32-char URL-safe token via `secrets.token_urlsafe(32)`.
  - Set `reset_token = token`, `reset_token_expires = utcnow() + timedelta(hours=1)`. Commit.
  - Send email via `email_mod.send_email()` with subject "Reset your password" and body containing `{site_url}/reset-password?token={token}`.
- Always return `{message: "If that email exists, a reset link has been sent"}` regardless of whether the email matched, to avoid leaking which addresses are registered.
- Use `from_email` from SMTP config (admin-controlled). Falls back to `noreply@mrtag.com` if SMTP config is missing — though in practice the email send will fail without SMTP, the response is identical so no info leak.

**`POST /api/auth/reset-password`**
- Body: `{ token: str, new_password: str }`
- Look up user by `reset_token`. If found AND `reset_token_expires > utcnow()`:
  - Update `hashed_password = hash_password(new_password)`.
  - Clear `reset_token` and `reset_token_expires` (set both to NULL).
  - Commit.
  - Return `{message: "Password updated"}`.
- If token missing/expired: return 400 `{detail: "Invalid or expired reset link"}`.

### Frontend
- **Login page**: add small "Forgot password?" link below the password field.
- **New route `/forgot-password`**: simple form (email input + Send button). On success, show "Check your inbox for a reset link." Always show this message regardless of whether the email exists.
- **New route `/reset-password`**: reads `?token=` from URL, shows two password inputs (new + confirm), submits to backend. On success, redirect to login with a success toast. On failure, show the error.
- Both routes are public (no auth required).

### Schemas (`backend/app/schemas.py`)
- `ForgotPasswordRequest(email: EmailStr)`
- `ResetPasswordRequest(token: str, new_password: str)` — `min_length=8` validator on `new_password`.

### Acceptance criteria
- Submitting an existing email triggers an email with a working reset link.
- Submitting a non-existent email returns the same generic success response.
- Reset link expires after 1 hour.
- Used tokens cannot be reused.

### Out of scope
- SMS reset, security questions, magic-link login.

---

## S1 — Cmd-K Global Search

### Goal
A keyboard-first palette to jump to anything: vignettes, photos, files, audio, family members.

### Approach
Use existing `cmdk` lib (already installed, exposed via shadcn `Command`). Mount a global `<CommandPalette />` in the app shell that listens for `Cmd+K` / `Ctrl+K`.

### Backend
Reuse existing `GET /api/search?q=...` endpoint. Verify it returns results across all content types (`SearchResult` union with `type`, `id`, `title`, `snippet`). If it doesn't include family members, extend it to.

### Frontend
- New file `src/features/search/CommandPalette.tsx`:
  - Renders shadcn `CommandDialog`.
  - Global keybind via `useEffect` adding a `keydown` listener (Cmd+K on Mac, Ctrl+K elsewhere).
  - Debounced query (200ms) via TanStack Query.
  - Result rows grouped by content type with type icons (FileText, Image, Music, File, User).
  - Enter / click navigates to the result's detail page.
  - Recent searches stored in `localStorage` (last 5).
- Mount inside `Layout.tsx` so it's available on every authenticated page.

### Acceptance criteria
- Cmd+K opens the palette from any authenticated page.
- Typing 2+ characters returns results within 500ms.
- Results are grouped by type with clear visual separation.
- Selecting a result navigates to that item's page.
- Esc closes the palette.

### Out of scope
- Saved searches, search history persistence beyond localStorage, fuzzy matching tweaks (server-side search behavior is unchanged).

---

## P1 — Photo Lightbox

### Goal
Click a photo in a grid → full-screen modal with previous/next navigation and pinch-zoom.

### Approach
Build on shadcn `Dialog`. No new lib — keep dependency footprint small.

### Component design
New `src/features/photos/components/PhotoLightbox.tsx`:
- Props: `photos: Photo[]`, `initialIndex: number`, `open: boolean`, `onClose: () => void`.
- Layout: full-screen backdrop, photo centered with `object-contain`. Close X top-right. Caption (title + description) overlay at bottom, dismissable.
- Navigation:
  - Left/Right arrow keys → previous/next photo.
  - On-screen chevrons (left + right edges of the screen, fade in on hover/touch).
  - Touch swipe (left/right) on mobile via simple touch event handling.
- Zoom:
  - Desktop: scroll wheel zooms (1× → 4×). Click+drag pans when zoomed.
  - Mobile: pinch-to-zoom via touch events.
  - Double-tap/click toggles fit ↔ zoom.
- Esc closes.
- Once Q2 ships: lightbox displays `medium_url` (1280px), not the original 5MB+ file. Falls back to `url` if `medium_url` is null (forward-compat with pre-Q2 photos).

### Integration
- `PhotosPage.tsx` and `AlbumDetailPage.tsx`: clicking a photo card opens the lightbox with the current photo set as the photos array.
- Photos already inside vignettes (TipTap embeds) are out of scope for P1 — they continue to open a simpler preview.

### Acceptance criteria
- Photo opens in lightbox on click in any grid view.
- Arrow keys navigate without closing the modal.
- Pinch-zoom works on iOS Safari and Android Chrome.
- Esc closes.

### Out of scope
- Slideshow auto-advance, EXIF metadata display, photo download button (separate item later).

---

## Q2 — Thumbnail Variants

### Goal
Stop loading 5MB originals in grid views. Generate small + medium variants on upload; keep originals for download.

### Naming convention
For an upload at key `photos/<uuid>.<ext>`, write two siblings:
- `photos/<uuid>_thumb.jpg` — 400px wide, JPEG quality 80
- `photos/<uuid>_med.jpg` — 1280px wide, JPEG quality 85
- Original kept as-is at `photos/<uuid>.<ext>`.

Always JPEG output for variants regardless of source format (PNG/HEIC/etc.) — smaller, more cache-friendly, no transparency needed for memories. Original preserves source format.

### Backend changes

**`storage.py`:**
- New helper `_make_variant(file_bytes, max_width, quality)`: returns JPEG bytes.
- Modify `upload_file()`: when category is `"photos"` AND `convert_heic=True`, also generate the two variants and upload them to R2 alongside the original. Return only the original key (variants are derived from it).
- New `get_variant_url(file_path: str, size: 'thumb' | 'med' | 'original') -> str`:
  - For `original`: return `get_file_url(file_path)`.
  - For `thumb`/`med`: derive variant key by replacing the extension with `_thumb.jpg` / `_med.jpg` and call `generate_presigned_url`.

**`schemas.py` (`PhotoResponse`):**
- Add optional fields `thumb_url: Optional[str]` and `medium_url: Optional[str]`.

**`main.py` (photo endpoints):**
- In `list_photos`, `get_photo`, `upload_photo` etc., populate `thumb_url` and `medium_url` from `get_variant_url`. If the variant doesn't exist (HEAD check would be too slow), still return the URL — clients fall back to `url` on image-load error.

### Backfill
**Decision:** backfill all 14 existing prod photos. Small enough to be quick, big UX win.

`backend/scripts/backfill_thumbnails.py`:
1. Connect to DB, list all `photos` + `background_images`.
2. For each: download original from R2 via boto3, generate `_thumb.jpg` and `_med.jpg`, upload back. Skip if variants already exist.
3. Run once manually after deploy: `flyctl ssh console --app gladney-family-tree -C "python scripts/backfill_thumbnails.py"`.

The deploy itself does NOT auto-run the backfill (one-shot script, not a migration). New uploads after deploy generate variants automatically.

### Frontend
- `PhotosPage` grid: switch `<img src={photo.url}>` → `<img src={photo.thumb_url || photo.url}>`.
- `PhotoLightbox` (P1): use `photo.medium_url || photo.url`.
- Album cover (where applicable): use `thumb_url`.

### Acceptance criteria
- New photo upload produces three R2 keys (thumb, med, original).
- Photos page grid loads in under 1 second on a 50-photo album (vs current >5s for originals).
- Backfill script handles all 14 existing photos without error and is idempotent (re-running skips already-processed ones).

### Out of scope
- WebP / AVIF variants, srcset / DPR-aware loading, on-the-fly resizing service.

---

## F1 — Family Tree Layout

### Goal
Replace `dagre`'s generic graph layout with `relatives-tree`'s genealogy-aware layout (couple-bars, generation alignment, sibling clusters).

### Approach
Keep `@xyflow/react` as the canvas (preserves dark mode, custom nodes, minimap, zoom). Swap `dagre` (used in `TreeCanvas.tsx`) for `relatives-tree`.

### Data transformation
`relatives-tree` expects nodes shaped like:
```ts
{ id: string, gender: 'male' | 'female', parents: Relative[], children: Relative[], siblings: Relative[], spouses: Relative[] }
```

Our DB has `family_members` (no gender column) and `family_relationships` (with `relationship_type`).

**Schema change:** add `family_members.gender VARCHAR` (nullable, no default). Add an optional gender selector to `MemberForm.tsx` (Male / Female / Unspecified). At adapter time, members with NULL gender default to `'male'` for layout purposes only — the DB stays NULL so we don't make assumptions about real people. (`relatives-tree` requires a value at the API; this default is purely for layout calc.)

**Adapter** `src/features/family-tree/lib/buildTreeData.ts`:
- Input: `members: FamilyMember[]`, `relationships: FamilyRelationship[]`.
- Output: array of `relatives-tree` nodes.
- Walks relationships once, aggregating `parents`/`children`/`siblings`/`spouses` per member.

### Position overrides
Existing `position_x`, `position_y` are user-customized positions. After `relatives-tree` computes auto-layout:
- For each member with non-zero `position_x` or `position_y`: override the computed position with the saved one.
- For members with default (0, 0): use the computed position.

This preserves any hand-tweaks while giving sensible defaults to new members.

Add a **"Reset to auto-layout"** button in the toolbar that nulls out all `position_x`/`position_y` overrides (with a confirmation).

### TreeCanvas changes
- Remove `dagre` import + layout call.
- Import `relatives-tree`, call it with the adapted data + a root member id (default: oldest member, or first in alphabetical order).
- Render each computed node as a React Flow node using the existing custom node component.
- Render couple-bar edges using a custom React Flow edge type (horizontal bar between spouses, with children dropping from midpoint).

### Acceptance criteria
- Tree with parents → child → spouses renders with couple-bar correctly positioned.
- Sibling cluster visible as group under shared parents.
- Manual drag-to-position still works and persists across reloads.
- "Reset to auto-layout" returns the tree to default layout.
- Performance: 50-member tree renders in under 200ms after data load.

### Out of scope (future waves)
- Pedigree / Descendant / Hourglass view toggle (F3).
- Pan-to-person search (F4).
- Path-finder (F5).
- Photo bubbles in nodes (F6).
- GEDCOM import (F2).

---

## Cross-cutting concerns

### Migrations
- F1 adds `family_members.gender VARCHAR` — single new Alembic migration.
- No other schema changes.

### Testing
This is a small family site with no existing test suite. Ship strategy: each item gets manual end-to-end verification against `mrtag.com` before moving to the next. Acceptance criteria above are the test plan. No automated test harness added in Wave 1 — separate concern.

### Rollout
- One PR per feature, merged to `main`, auto-deploys via existing Fly workflow.
- After each deploy, smoke-test the affected feature, watch logs for 30s for tracebacks.
- If anything regresses badly (auth break, DB error, blank page), revert the offending commit and re-investigate.

### Docs
- Update `docs/changelog.md` with one line per feature as it ships.
- No new top-level docs needed.
