# Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship six independent, low-risk improvements to mrtag.com — SMTP setup walkthrough, password reset, Cmd-K global search, photo lightbox, thumbnail variants, and genealogy-aware family tree layout.

**Architecture:** Each phase is independent; ships as its own commit + auto-deploy. Phase 1 (D1) blocks Phase 2 (U3 needs SMTP). All others are independent and ordered for fastest user-felt wins first.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind v4 (frontend); FastAPI + SQLAlchemy 2.0 + Alembic + Postgres (backend); R2 storage; auto-deploy via Fly.io on push to `main`.

**Spec:** `docs/superpowers/specs/2026-04-20-wave-1-design.md`

**Verification posture:** No formal test suite exists. Each task ends with: typecheck → lint → manual probe against running dev server or prod (after deploy). Acceptance criteria from the spec are the test plan.

---

## Phase 1 — D1: SMTP Setup Walkthrough

**Files:**
- Modify: `backend/app/main.py` (lines 238-254 — `test_smtp_config` endpoint)
- Modify: `backend/app/email.py` (capture last error from `send_email`)
- Modify: `frontend/src/features/admin/AdminPage.tsx` (lines 263-343 — `SmtpForm` + `SmtpSection`)

### Task 1.1 — Backend: surface SMTP error message

- [ ] **Step 1: Modify `backend/app/email.py` to expose last error**

Replace the `send_email` function (lines 35-53) with:

```python
def send_email(to: str, subject: str, html: str, db: 'Session | None' = None) -> tuple[bool, str | None]:
    """Returns (success, error_message). error_message is None on success."""
    cfg = get_smtp_config(db)
    if not cfg['smtp_host'] or not cfg['smtp_user']:
        msg = "SMTP not configured (missing host or user)"
        print(f"[EMAIL] {msg}. Would send to {to}: {subject}")
        return False, msg
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{cfg['from_name']} <{cfg['from_email']}>"
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(cfg['smtp_host'], cfg['smtp_port']) as s:
            s.starttls()
            s.login(cfg['smtp_user'], cfg['smtp_password'])
            s.sendmail(cfg['from_email'], to, msg.as_string())
        return True, None
    except Exception as e:
        err = f"{type(e).__name__}: {e}"
        print(f"[EMAIL] Failed: {err}")
        return False, err
```

- [ ] **Step 2: Update `send_invite_email` and `notify_admin_new_registration` to handle the new tuple**

In `send_invite_email`: change `return send_email(...)` (last line) to:
```python
ok, _ = send_email(to_email, "You're invited to the Gladney Family Tree", html, db)
return ok
```

In `notify_admin_new_registration`: change `send_email(...)` call to:
```python
send_email(admin_email, ..., html, db)  # discard tuple — best-effort
```

(Both callers only care about the boolean.)

- [ ] **Step 3: Modify `test_smtp_config` endpoint in `backend/app/main.py` (around line 238)**

Replace the existing function with:

```python
@app.post("/api/admin/smtp-config/test")
def test_smtp_config(db: Session = Depends(get_db), cu: models.User = Depends(get_current_admin_user)):
    cfg = email_mod.get_smtp_config(db)
    if not cfg['smtp_host'] or not cfg['smtp_user']:
        raise HTTPException(400, "SMTP not configured")
    test_to = cfg['admin_email'] or cu.email
    if not test_to:
        raise HTTPException(400, "No recipient email — set Admin Email in SMTP config")
    ok, err = email_mod.send_email(
        test_to,
        "Test email from your family site",
        f"<p>If you can read this, SMTP is working.</p><p>Sent by: {cu.username}</p>",
        db,
    )
    if not ok:
        raise HTTPException(400, err or "Email send failed (no error message)")
    return {"message": f"Test email sent to {test_to}"}
```

- [ ] **Step 4: Verify backend changes**

Run: `cd backend && python -c "from app.main import app; print('OK')"`
Expected: `OK` (no import errors)

- [ ] **Step 5: Commit backend changes**

```bash
git add backend/app/email.py backend/app/main.py
git commit -m "Surface SMTP error message in test-email endpoint (D1)"
```

### Task 1.2 — Frontend: SMTP UI improvements

- [ ] **Step 1: Add Gmail preset + how-to disclosure to `SmtpForm`**

In `frontend/src/features/admin/AdminPage.tsx`, replace the `SmtpForm` function (lines 263-343) with:

```tsx
function SmtpForm({ current, save, test }: SmtpFormProps) {
  const [form, setForm] = useState({
    smtp_host: current?.smtp_host ?? '',
    smtp_port: current?.smtp_port ?? 587,
    smtp_user: current?.smtp_user ?? '',
    smtp_password: '',
    from_email: current?.from_email ?? '',
    from_name: current?.from_name ?? 'LandTG Memories',
    admin_email: current?.admin_email ?? '',
    site_url: current?.site_url ?? 'https://mrtag.com',
  });
  const [showHelp, setShowHelp] = useState(false);

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function applyGmailPreset() {
    setForm((f) => ({ ...f, smtp_host: 'smtp.gmail.com', smtp_port: 587 }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save.mutate({ ...form, smtp_port: Number(form.smtp_port) });
  }

  const inputCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-border">
        <button
          type="button"
          onClick={() => test.mutate()}
          disabled={test.isPending || !current?.configured}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {test.isPending ? 'Sending…' : 'Send a test email'}
        </button>
        <button
          type="button"
          onClick={applyGmailPreset}
          className="rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
        >
          Use Gmail (recommended)
        </button>
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          className="text-xs text-primary hover:underline ml-auto"
        >
          {showHelp ? 'Hide help' : 'How to get a Gmail app password →'}
        </button>
      </div>

      {showHelp && (
        <div className="rounded-md bg-muted/50 border border-border p-4 text-xs text-foreground space-y-2">
          <p className="font-medium">Setting up Gmail SMTP (5 minutes):</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Visit <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">myaccount.google.com</a> → Security.</li>
            <li>Enable <strong>2-Step Verification</strong> if not already on (required for app passwords).</li>
            <li>Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-primary hover:underline">App passwords</a>, choose "Mail" / "Other (Custom name)", type "Family Tree", click Generate.</li>
            <li>Copy the 16-character password Google shows (no spaces).</li>
            <li>Paste it into <strong>SMTP Password</strong> below; set <strong>SMTP Username</strong> + <strong>From Email</strong> to your Gmail address.</li>
          </ol>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">SMTP Host</label>
          <input className={inputCls} value={form.smtp_host} onChange={(e) => set('smtp_host', e.target.value)} placeholder="smtp.gmail.com" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Port</label>
          <input className={inputCls} type="number" value={form.smtp_port} onChange={(e) => set('smtp_port', e.target.value)} placeholder="587" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">SMTP Username</label>
          <input className={inputCls} value={form.smtp_user} onChange={(e) => set('smtp_user', e.target.value)} placeholder="you@gmail.com" autoComplete="off" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            SMTP Password {current?.configured && <span className="text-muted-foreground">(leave blank to keep current)</span>}
          </label>
          <input className={inputCls} type="password" value={form.smtp_password} onChange={(e) => set('smtp_password', e.target.value)} placeholder={current?.configured ? '••••••••' : 'App password'} autoComplete="new-password" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From Email</label>
          <input className={inputCls} value={form.from_email} onChange={(e) => set('from_email', e.target.value)} placeholder="you@gmail.com" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From Name</label>
          <input className={inputCls} value={form.from_name} onChange={(e) => set('from_name', e.target.value)} placeholder="LandTG Memories" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Admin Notification Email</label>
          <input className={inputCls} value={form.admin_email} onChange={(e) => set('admin_email', e.target.value)} placeholder="admin@example.com" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Site URL</label>
          <input className={inputCls} value={form.site_url} onChange={(e) => set('site_url', e.target.value)} placeholder="https://mrtag.com" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Improve test-email feedback in `useTestSmtpConfig` hook**

Open `frontend/src/features/admin/hooks/useAdmin.ts`. Find `useTestSmtpConfig` and verify it surfaces the error. Read the file first; if it does not show toast notifications for both success and failure with the actual message, update it to:

```ts
export function useTestSmtpConfig() {
  return useMutation({
    mutationFn: () => adminApi.testSmtp(),
    onSuccess: (data) => toast({ title: 'Test email sent', description: data.message }),
    onError: (err: Error) => toast({ title: 'Test email failed', description: err.message, variant: 'destructive' }),
  });
}
```

(Adapt to whatever toast helper the file already uses; reuse existing imports — don't add new ones.)

- [ ] **Step 3: Frontend typecheck + lint**

Run: `cd frontend && npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit frontend changes**

```bash
git add frontend/src/features/admin/AdminPage.tsx frontend/src/features/admin/hooks/useAdmin.ts
git commit -m "Add Gmail preset + Gmail app-password help to SMTP form (D1)"
```

- [ ] **Step 5: Push and verify deploy**

```bash
git push origin main
gh run watch $(gh run list --workflow=fly-deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

After deploy, manually:
1. Log in as admin → Admin → SMTP section.
2. Click "Use Gmail (recommended)" — host/port should populate.
3. Open the help disclosure — instructions should be readable.
4. Click "Send test email" with bad credentials → toast should show the actual SMTP error (e.g. "Authentication failed").

---

## Phase 2 — U3: Password Reset

**Hard dependency:** Phase 1 (D1) must be complete AND SMTP must be configured in prod (admin sets it via the new UI). If SMTP is not configured before this ships, the reset emails won't be delivered.

**Files:**
- Modify: `backend/app/schemas.py` (add 2 schemas)
- Modify: `backend/app/main.py` (add 2 endpoints in the auth section)
- Modify: `backend/app/email.py` (add `send_password_reset_email`)
- Create: `frontend/src/features/auth/ForgotPasswordPage.tsx`
- Create: `frontend/src/features/auth/ResetPasswordPage.tsx`
- Modify: `frontend/src/features/auth/LoginPage.tsx` (add "Forgot password?" link)
- Modify: `frontend/src/app/router.tsx` (add 2 routes)
- Modify: `frontend/src/lib/api/auth.ts` (add 2 API calls)
- Modify: `frontend/src/types/api.ts` (add request types)

### Task 2.1 — Backend schemas + endpoints

- [ ] **Step 1: Add reset schemas to `backend/app/schemas.py`**

Insert below `class PasswordChange` (line 35):

```python
class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
```

- [ ] **Step 2: Add `send_password_reset_email` to `backend/app/email.py`**

Insert below `send_invite_email`:

```python
def send_password_reset_email(to_email: str, username: str, token: str, db: 'Session | None' = None) -> bool:
    cfg = get_smtp_config(db)
    site_url = cfg['site_url'] or 'https://mrtag.com'
    link = f"{site_url}/reset-password?token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
      <h2 style="color:#1a1a1a;">Reset your password</h2>
      <p>Hi {username},</p>
      <p>Someone (hopefully you) requested a password reset for your account on the Gladney Family Tree.</p>
      <p style="margin:24px 0;">
        <a href="{link}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Reset Password</a>
      </p>
      <p style="color:#666;font-size:13px;">Or copy this link: <a href="{link}">{link}</a></p>
      <p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    </div>
    """
    ok, _ = send_email(to_email, "Reset your password", html, db)
    return ok
```

- [ ] **Step 3: Add `forgot-password` endpoint to `backend/app/main.py`**

Insert after the existing `change_password` endpoint (around line 99 — find `@app.put("/api/users/me/password")`):

```python
@app.post("/api/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user and user.is_active:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        email_mod.send_password_reset_email(user.email, user.username, token, db)
    # Always return the same response — don't leak which emails are registered
    return {"message": "If that email exists, a reset link has been sent"}
```

Add the necessary imports at the top of `main.py` if missing:
```python
from datetime import datetime, timedelta
```

(Check existing imports — `datetime` is likely already imported via `from .schemas import *`. If not, add it explicitly.)

- [ ] **Step 4: Add `reset-password` endpoint to `backend/app/main.py`**

Insert immediately after `forgot-password`:

```python
@app.post("/api/auth/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(payload.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    user = db.query(models.User).filter(models.User.reset_token == payload.token).first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        raise HTTPException(400, "Invalid or expired reset link")
    user.hashed_password = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return {"message": "Password updated"}
```

- [ ] **Step 5: Verify backend imports + boot**

Run: `cd backend && python -c "from app.main import app; print('routes:', len(app.routes))"`
Expected: prints route count, no errors.

- [ ] **Step 6: Commit backend reset endpoints**

```bash
git add backend/app/schemas.py backend/app/email.py backend/app/main.py
git commit -m "Add forgot-password + reset-password endpoints (U3)"
```

### Task 2.2 — Frontend pages + routing

- [ ] **Step 1: Add request types to `frontend/src/types/api.ts`**

Append at the end of the file:

```ts
export interface ForgotPasswordRequest { email: string }
export interface ResetPasswordRequest { token: string; new_password: string }
```

- [ ] **Step 2: Add API calls to `frontend/src/lib/api/auth.ts`**

Read the file first to match its existing style. Add these two functions to the exported `authApi` object (or however the file structures it):

```ts
forgotPassword: (data: ForgotPasswordRequest) =>
  client.post<{ message: string }>('/api/auth/forgot-password', data).then(r => r.data),

resetPassword: (data: ResetPasswordRequest) =>
  client.post<{ message: string }>('/api/auth/reset-password', data).then(r => r.data),
```

Add `ForgotPasswordRequest`, `ResetPasswordRequest` to the type imports at the top.

- [ ] **Step 3: Create `frontend/src/features/auth/ForgotPasswordPage.tsx`**

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/lib/api/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we'll send you a link to reset.
          </p>
        </div>
        {submitted ? (
          <div className="rounded-md bg-muted border border-border p-4 text-sm text-foreground">
            <p className="font-medium">Check your inbox.</p>
            <p className="mt-1 text-muted-foreground">
              If that email is registered, a reset link is on its way. The link expires in 1 hour.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/features/auth/ResetPasswordPage.tsx`**

```tsx
import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/lib/api/auth';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (!token) { setError('Missing reset token'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, new_password: password });
      navigate('/login?reset=ok', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Choose a new password</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-foreground">New password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="confirm" className="text-sm font-medium text-foreground">Confirm password</label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add "Forgot password?" link to `LoginPage.tsx`**

In `frontend/src/features/auth/LoginPage.tsx`, after the password input block (line 73, the closing `</div>` of the password's `space-y-1`), insert:

```tsx
<div className="text-right">
  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
    Forgot password?
  </Link>
</div>
```

Also add a success banner at the top (just under the heading at line 39) for the post-reset redirect:

```tsx
{new URLSearchParams(location.search).get('reset') === 'ok' && (
  <div className="rounded-md bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400">
    Password updated. Sign in with your new password.
  </div>
)}
```

(The file already imports `Link` and `useLocation` — reuse them, don't add duplicates.)

- [ ] **Step 6: Add routes to `frontend/src/app/router.tsx`**

After `RegisterPage` lazy import (line 7), add:

```tsx
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
```

In the routes array, after the `/register` route (line 37), add:

```tsx
{
  path: '/forgot-password',
  element: <Suspense fallback={null}><ForgotPasswordPage /></Suspense>,
},
{
  path: '/reset-password',
  element: <Suspense fallback={null}><ResetPasswordPage /></Suspense>,
},
```

- [ ] **Step 7: Frontend typecheck + lint**

Run: `cd frontend && npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 8: Commit + push frontend changes**

```bash
git add frontend/src/types/api.ts frontend/src/lib/api/auth.ts frontend/src/features/auth/ForgotPasswordPage.tsx frontend/src/features/auth/ResetPasswordPage.tsx frontend/src/features/auth/LoginPage.tsx frontend/src/app/router.tsx
git commit -m "Add forgot-password + reset-password pages (U3)"
git push origin main
```

- [ ] **Step 9: Wait for deploy + manual verify**

```bash
gh run watch $(gh run list --workflow=fly-deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

Manual checks:
1. Visit mrtag.com/login → "Forgot password?" link visible.
2. Click → forgot-password page.
3. Submit a registered email → "Check your inbox" message + email arrives.
4. Click reset link → reset page → submit new password → redirected to login with success banner.
5. Sign in with new password → success.
6. Submit a non-registered email → still shows "Check your inbox" (no info leak).
7. Re-use a consumed token → "Invalid or expired reset link".

---

## Phase 3 — S1: Cmd-K Global Search

**Files:**
- Create: `frontend/src/features/search/CommandPalette.tsx`
- Modify: `frontend/src/app/Layout.tsx` (mount palette globally)
- (Optional) Modify: `backend/app/main.py` search endpoint to also include family members

### Task 3.1 — Backend: include family members in search

- [ ] **Step 1: Extend `/api/search` to include family members**

In `backend/app/main.py`, modify the `search` function (line 697). After the existing files loop (line 707-708), insert:

```python
for fm in db.query(models.FamilyMember).filter(
    models.FamilyMember.first_name.ilike(like) | models.FamilyMember.last_name.ilike(like) | models.FamilyMember.bio.ilike(like)
).limit(10).all():
    title = " ".join(filter(None, [fm.first_name, fm.last_name]))
    results.append(SearchResult(content_type="family_member", id=fm.id, title=title, created_at=fm.created_at))
```

- [ ] **Step 2: Verify backend boots**

Run: `cd backend && python -c "from app.main import app; print('OK')"`

- [ ] **Step 3: Commit backend search update**

```bash
git add backend/app/main.py
git commit -m "Include family members in /api/search results (S1)"
```

### Task 3.2 — Frontend: command palette

- [ ] **Step 1: Create `frontend/src/features/search/CommandPalette.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search';
import { FileText, Image, Music, File as FileIcon, User } from 'lucide-react';
import type { SearchResult } from '@/types/api';

const ROUTE_FOR_TYPE: Record<string, string> = {
  vignette: '/vignettes',
  photo: '/photos',
  audio: '/audio',
  file: '/files',
  family_member: '/family-tree',
};

const ICON_FOR_TYPE: Record<string, typeof FileText> = {
  vignette: FileText,
  photo: Image,
  audio: Music,
  file: FileIcon,
  family_member: User,
};

const TYPE_LABEL: Record<string, string> = {
  vignette: 'Vignettes',
  photo: 'Photos',
  audio: 'Audio',
  file: 'Files',
  family_member: 'Family',
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Cmd+K / Ctrl+K toggle
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Reset query when closing
  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const { data: results = [] } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchApi.search(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });

  // Group by content_type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.content_type] ||= []).push(r);
    return acc;
  }, {});

  function go(r: SearchResult) {
    setOpen(false);
    navigate(ROUTE_FOR_TYPE[r.content_type] ?? '/');
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50"
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-full max-w-xl rounded-lg border border-border bg-popover shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        shouldFilter={false}
      >
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Search vignettes, photos, family members…"
          className="w-full px-4 py-3 text-sm bg-transparent text-foreground border-b border-border focus:outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          {query.trim().length < 2 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Type at least 2 characters to search.
            </p>
          )}
          {query.trim().length >= 2 && results.length === 0 && (
            <Command.Empty className="px-3 py-6 text-center text-xs text-muted-foreground">
              No results.
            </Command.Empty>
          )}
          {Object.entries(grouped).map(([type, items]) => {
            const Icon = ICON_FOR_TYPE[type] ?? FileText;
            return (
              <Command.Group key={type} heading={TYPE_LABEL[type] ?? type} className="text-xs text-muted-foreground px-2 py-1">
                {items.map((r) => (
                  <Command.Item
                    key={`${type}-${r.id}`}
                    value={`${type}-${r.id}-${r.title}`}
                    onSelect={() => go(r)}
                    className="flex items-center gap-3 px-3 py-2 rounded text-sm text-foreground cursor-pointer aria-selected:bg-accent"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{r.title}</p>
                      {r.snippet && <p className="text-xs text-muted-foreground truncate">{r.snippet}</p>}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}
        </Command.List>
        <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs text-muted-foreground">
          <span>↑↓ navigate · ↵ select</span>
          <span>Esc close</span>
        </div>
      </Command>
    </div>
  );
}
```

- [ ] **Step 2: Verify `searchApi.search` exists**

Open `frontend/src/lib/api/search.ts`. Confirm it exports `searchApi` with a `search(query: string)` method that returns `Promise<SearchResult[]>`. If not, add:

```ts
import { client } from './client';
import type { SearchResult } from '@/types/api';

export const searchApi = {
  search: (q: string) => client.get<SearchResult[]>(`/api/search`, { params: { q } }).then(r => r.data),
};
```

(Read the file before editing — don't duplicate exports.)

- [ ] **Step 3: Mount `<CommandPalette />` in `Layout.tsx`**

Open `frontend/src/app/Layout.tsx`. Import the palette at the top:

```tsx
import { CommandPalette } from '@/features/search/CommandPalette';
```

Inside the layout's returned JSX, add `<CommandPalette />` as a sibling of the main content (e.g. just before the closing root div). Place is not visually significant — it's a portal-style overlay.

- [ ] **Step 4: Frontend typecheck + lint**

Run: `cd frontend && npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit + push**

```bash
git add frontend/src/features/search/CommandPalette.tsx frontend/src/lib/api/search.ts frontend/src/app/Layout.tsx
git commit -m "Add Cmd-K global command palette (S1)"
git push origin main
```

- [ ] **Step 6: Wait for deploy + manual verify**

```bash
gh run watch $(gh run list --workflow=fly-deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

Manual:
1. On any authenticated page, press Cmd+K (Mac) or Ctrl+K (Win/Linux) → palette opens.
2. Type "test" or any known title → results stream in within ~500ms, grouped by type.
3. Arrow keys move selection; Enter navigates.
4. Esc closes; clicking outside closes.

---

## Phase 4 — P1: Photo Lightbox

**Files:**
- Create: `frontend/src/features/photos/components/PhotoLightbox.tsx`
- Modify: `frontend/src/features/photos/PhotosPage.tsx` (replace existing inline `Lightbox` at lines 259-283; pass photo array)
- Modify: `frontend/src/features/photos/components/AlbumView.tsx` (use new lightbox; pass full album photos array)

### Task 4.1 — Build the lightbox component

- [ ] **Step 1: Create `frontend/src/features/photos/components/PhotoLightbox.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import type { Photo } from '@/types/api';

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export function PhotoLightbox({ photos, initialIndex, onClose }: PhotoLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const touchStartX = useRef<number | null>(null);

  const photo = photos[index];

  function next() { setZoom(1); setIndex((i) => Math.min(i + 1, photos.length - 1)); }
  function prev() { setZoom(1); setIndex((i) => Math.max(i - 1, 0)); }

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  }
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.max(1, Math.min(4, z - e.deltaY * 0.002)));
  }
  function handleDoubleClick() {
    setZoom((z) => (z > 1 ? 1 : 2));
  }

  // Prefer medium variant (Q2), fall back to original
  const src =
    (photo as Photo & { medium_url?: string | null }).medium_url ||
    photo.url ||
    '';

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        disabled={index === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/60 text-white hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed text-2xl"
        aria-label="Previous photo"
      >‹</button>

      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        disabled={index === photos.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/60 text-white hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed text-2xl"
        aria-label="Next photo"
      >›</button>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-black/60 text-white w-10 h-10 flex items-center justify-center hover:bg-black"
        aria-label="Close"
      >✕</button>

      <div
        className="relative max-w-7xl max-h-[90vh] p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={src}
          alt={photo.title ?? photo.filename}
          className="max-w-full max-h-[80vh] object-contain rounded-lg select-none transition-transform"
          style={{ transform: `scale(${zoom})`, cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }}
          draggable={false}
        />
        {(photo.title || photo.description) && (
          <div className="mt-2 text-center text-white text-sm space-y-1 max-w-2xl mx-auto">
            {photo.title && <p className="font-medium">{photo.title}</p>}
            {photo.description && <p className="text-white/80 text-xs">{photo.description}</p>}
          </div>
        )}
        <p className="absolute bottom-4 left-4 text-xs text-white/60">
          {index + 1} / {photos.length}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `PhotosPage.tsx` to use the new lightbox**

In `frontend/src/features/photos/PhotosPage.tsx`:

a) Add import at the top:
```tsx
import { PhotoLightbox } from './components/PhotoLightbox';
```

b) Change the lightbox state shape (line 27):
```tsx
const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
```

(Replace `lightbox: Photo | null` everywhere.)

c) Build the photo array used for navigation. Just above the `return (`, compute the visible photos array (mirror the sort logic from line 204):
```tsx
const visiblePhotos = [...(photos ?? [])].sort((a, b) => {
  const aVal = sortKey === 'taken_at' ? (a.taken_at ?? a.created_at) : a.created_at;
  const bVal = sortKey === 'taken_at' ? (b.taken_at ?? b.created_at) : b.created_at;
  const diff = new Date(aVal).getTime() - new Date(bVal).getTime();
  return sortDir === 'desc' ? -diff : diff;
});
```

Pass `visiblePhotos` (instead of inline-sorted) to `PhotoGrid`. Update `onSelect={setLightbox}` to `onSelect={(p) => setLightboxIndex(visiblePhotos.findIndex(x => x.id === p.id))}`.

d) Replace the bottom usage (line 254):
```tsx
{lightboxIndex !== null && (
  <PhotoLightbox
    photos={visiblePhotos}
    initialIndex={lightboxIndex}
    onClose={() => setLightboxIndex(null)}
  />
)}
```

e) Delete the inline `function Lightbox(...)` (lines 259-283) — no longer used.

f) Update the `selectedAlbum` branch (lines 51-63) to drop the legacy lightbox prop or pass-through to AlbumView (handled in step 3).

- [ ] **Step 3: Update `AlbumView.tsx` to use the new lightbox**

Read `frontend/src/features/photos/components/AlbumView.tsx`. Replace its `onLightbox: (p: Photo) => void` callback with an `onPhotoClick: (index: number) => void` callback, and have AlbumView own its lightbox via `<PhotoLightbox photos={albumPhotos} initialIndex={...} />` internally. Or, simpler: make AlbumView import and use `PhotoLightbox` directly using the album's photos as the array. Wire `onClose` to clear local state.

(Specific code depends on AlbumView's current shape — read first, refactor minimally.)

- [ ] **Step 4: Frontend typecheck + lint**

Run: `cd frontend && npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit + push**

```bash
git add frontend/src/features/photos/
git commit -m "Add photo lightbox with arrow navigation, swipe, and zoom (P1)"
git push origin main
```

- [ ] **Step 6: Wait for deploy + manual verify**

Manual:
1. mrtag.com/photos → click a photo → lightbox opens.
2. Arrow keys navigate prev/next; counter (1/N) updates.
3. Click chevrons left/right — same.
4. Scroll wheel zooms in/out (1× to 4×). Double-click toggles 1× ↔ 2×.
5. Esc and clicking outside both close.
6. On mobile: swipe left/right navigates, pinch zoom works.

---

## Phase 5 — Q2: Thumbnail Variants

**Files:**
- Modify: `backend/app/storage.py` (variant generation)
- Modify: `backend/app/schemas.py` (add `thumb_url`, `medium_url` to `PhotoResponse`)
- Modify: `backend/app/main.py` (populate variant URLs in photo endpoints)
- Create: `backend/scripts/backfill_thumbnails.py`
- Modify: `frontend/src/types/api.ts` (add fields to `Photo` interface)
- Modify: `frontend/src/features/photos/components/PhotoGrid.tsx` (use `thumb_url`)
- Modify: `frontend/src/features/photos/components/PhotoLightbox.tsx` (already prefers `medium_url` — no change)

### Task 5.1 — Backend: variant generation

- [ ] **Step 1: Add `_make_variant` helper to `backend/app/storage.py`**

Insert after `_convert_heic` (around line 47):

```python
def _make_variant(file_bytes: bytes, max_width: int, quality: int) -> bytes:
    """Generate a JPEG variant scaled to max_width (preserves aspect ratio)."""
    from PIL import Image
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()
    except ImportError:
        pass
    img = Image.open(io.BytesIO(file_bytes))
    if img.mode != "RGB":
        img = img.convert("RGB")
    if img.width > max_width:
        ratio = max_width / img.width
        new_height = int(img.height * ratio)
        img = img.resize((max_width, new_height), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=quality, optimize=True)
    return out.getvalue()
```

- [ ] **Step 2: Modify `upload_file` to also write variants for photos**

In `backend/app/storage.py`, modify `upload_file` (line 49). After the original `put_object` for cloud storage (line 71), add:

```python
        # For photo uploads, also generate thumbnail and medium variants
        if category == "photos":
            try:
                base_no_ext = key.rsplit(".", 1)[0]
                thumb = _make_variant(file_bytes, max_width=400, quality=80)
                med = _make_variant(file_bytes, max_width=1280, quality=85)
                _s3().put_object(Bucket=S3_BUCKET_NAME, Key=f"{base_no_ext}_thumb.jpg", Body=thumb, ContentType="image/jpeg")
                _s3().put_object(Bucket=S3_BUCKET_NAME, Key=f"{base_no_ext}_med.jpg", Body=med, ContentType="image/jpeg")
            except Exception as e:
                print(f"[STORAGE] Variant generation failed for {key}: {e}")
```

(Variants are best-effort — if they fail, the original is still uploaded successfully and the frontend falls back to `url`.)

- [ ] **Step 3: Add `get_variant_url` to `backend/app/storage.py`**

Append to the file:

```python
def get_variant_url(file_path: str, size: str = "original") -> str:
    """size: 'thumb' | 'med' | 'original'. Falls back to original on unknown."""
    if size == "original" or not file_path:
        return get_file_url(file_path)
    base_no_ext = file_path.rsplit(".", 1)[0]
    variant_key = f"{base_no_ext}_{size}.jpg"
    return get_file_url(variant_key)
```

- [ ] **Step 4: Add `thumb_url` and `medium_url` to `PhotoResponse`**

In `backend/app/schemas.py` (around line 84), update `PhotoResponse`:

```python
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
```

- [ ] **Step 5: Populate variant URLs in photo endpoints**

In `backend/app/main.py`, find `list_photos` (around line 324) and `upload_photo` (around line 335). After each existing `d.url = get_file_url(p.file_path)` (or similar), add:

```python
        d.thumb_url = get_variant_url(p.file_path, "thumb")
        d.medium_url = get_variant_url(p.file_path, "med")
```

Also import `get_variant_url`:
```python
from .storage import upload_file, get_file_url, delete_file, get_variant_url
```

(Check the existing import line and add it.)

- [ ] **Step 6: Verify backend boots**

Run: `cd backend && python -c "from app.main import app; print('OK')"`

- [ ] **Step 7: Commit backend variant support**

```bash
git add backend/app/storage.py backend/app/schemas.py backend/app/main.py
git commit -m "Generate thumbnail + medium variants on photo upload (Q2 backend)"
```

### Task 5.2 — Backfill script for existing photos

- [ ] **Step 1: Create `backend/scripts/backfill_thumbnails.py`**

```python
"""One-shot: generate _thumb.jpg + _med.jpg variants for every existing photo
that doesn't already have them. Idempotent — safe to re-run.

Usage:
    flyctl ssh console --app gladney-family-tree -C "python scripts/backfill_thumbnails.py"
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure we can import the app package
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app import models
from app.storage import _s3, _make_variant, S3_BUCKET_NAME, USE_CLOUD_STORAGE


def has_variant(s3, bucket: str, key: str) -> bool:
    try:
        s3.head_object(Bucket=bucket, Key=key)
        return True
    except Exception:
        return False


def main() -> int:
    if not USE_CLOUD_STORAGE:
        print("USE_CLOUD_STORAGE is not true — nothing to do.")
        return 0

    s3 = _s3()
    db = SessionLocal()
    try:
        photos = db.query(models.Photo).all()
        print(f"Found {len(photos)} photos in DB")
        ok = skipped = failed = 0
        for p in photos:
            key = p.file_path
            if not key or "/" not in key or key.startswith("http"):
                print(f"  SKIP id={p.id} bad key={key!r}")
                skipped += 1
                continue
            base = key.rsplit(".", 1)[0]
            thumb_key = f"{base}_thumb.jpg"
            med_key = f"{base}_med.jpg"
            if has_variant(s3, S3_BUCKET_NAME, thumb_key) and has_variant(s3, S3_BUCKET_NAME, med_key):
                print(f"  SKIP id={p.id} variants exist")
                skipped += 1
                continue
            try:
                obj = s3.get_object(Bucket=S3_BUCKET_NAME, Key=key)
                body = obj["Body"].read()
                thumb = _make_variant(body, 400, 80)
                med = _make_variant(body, 1280, 85)
                s3.put_object(Bucket=S3_BUCKET_NAME, Key=thumb_key, Body=thumb, ContentType="image/jpeg")
                s3.put_object(Bucket=S3_BUCKET_NAME, Key=med_key, Body=med, ContentType="image/jpeg")
                print(f"  OK   id={p.id} → {thumb_key}, {med_key}")
                ok += 1
            except Exception as e:
                print(f"  FAIL id={p.id} key={key} err={e}")
                failed += 1
        print(f"Done: ok={ok} skipped={skipped} failed={failed}")
        return 0 if failed == 0 else 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Commit backfill script + push**

```bash
git add backend/scripts/backfill_thumbnails.py
git commit -m "Add backfill script for existing photo variants (Q2)"
git push origin main
```

- [ ] **Step 3: Wait for deploy**

```bash
gh run watch $(gh run list --workflow=fly-deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

- [ ] **Step 4: Run backfill against prod**

```bash
flyctl ssh console --app gladney-family-tree -C "python scripts/backfill_thumbnails.py"
```

Expected: prints `OK` lines for each of the 14 existing photos, `Done: ok=14 skipped=0 failed=0`.

If any FAIL, investigate per-photo (likely transient R2 issue; re-run is safe — it skips already-done photos).

### Task 5.3 — Frontend: use thumbnails in grids

- [ ] **Step 1: Add fields to `Photo` interface**

In `frontend/src/types/api.ts` (line 17), update:

```ts
export interface Photo { id: number; filename: string; file_path: string; url: string | null; thumb_url: string | null; medium_url: string | null; title: string | null; description: string | null; uploaded_by_id: number; taken_at: string | null; sort_order: number; created_at: string }
```

- [ ] **Step 2: Use `thumb_url` in `PhotoGrid.tsx`**

Read `frontend/src/features/photos/components/PhotoGrid.tsx`. Find the `<img src={...}>` that renders each photo card. Change to:

```tsx
<img src={photo.thumb_url || photo.url || ''} ... />
```

(Adjust to actual prop name — could be `p.thumb_url`, etc. Keep the existing alt/className.)

Apply the same change anywhere else photos render in grid form (album cards, admin content tab — search the codebase for `photo.url` and update where appropriate). The lightbox already prefers `medium_url`, so no change there.

- [ ] **Step 3: Frontend typecheck + lint**

Run: `cd frontend && npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit + push frontend**

```bash
git add frontend/src/types/api.ts frontend/src/features/photos/
git commit -m "Use thumbnail variants in photo grids (Q2 frontend)"
git push origin main
```

- [ ] **Step 5: Wait for deploy + manual verify**

Manual:
1. mrtag.com/photos → grid loads noticeably faster (DevTools → Network → image sizes should be ~30-80KB instead of 1-5MB).
2. Click a photo → lightbox shows the medium variant (look for `_med.jpg` in network tab).
3. Upload a new photo → check R2 (or via DevTools) that three keys exist: original, _thumb, _med.

---

## Phase 6 — F1: Family Tree Layout

**Files:**
- Create: Alembic migration for `family_members.gender`
- Modify: `backend/app/models.py` (add `gender` column)
- Modify: `backend/app/schemas.py` (add `gender` to FamilyMember schemas)
- Modify: `backend/app/main.py` (no functional change — schemas auto-include)
- Modify: `frontend/src/types/api.ts` (add `gender` to FamilyMember)
- Create: `frontend/src/features/family-tree/lib/buildTreeData.ts`
- Modify: `frontend/src/features/family-tree/components/TreeCanvas.tsx` (replace dagre with relatives-tree)
- Modify: `frontend/src/features/family-tree/components/MemberForm.tsx` (add gender selector)
- Modify: `frontend/src/features/family-tree/FamilyTreePage.tsx` (add "Reset layout" button)
- Modify: `frontend/package.json` (add `relatives-tree`)

### Task 6.1 — Backend: gender column

- [ ] **Step 1: Add column to model**

In `backend/app/models.py`, find class `FamilyMember` (around line 171). Add a new column after `bio`:

```python
    gender = Column(String, nullable=True)  # 'male' | 'female' | None
```

- [ ] **Step 2: Generate Alembic migration**

```bash
cd backend
source venv/bin/activate
alembic revision -m "add gender to family_members"
```

- [ ] **Step 3: Edit the generated migration file**

In the new file under `backend/alembic/versions/`, fill in:

```python
def upgrade() -> None:
    op.execute("ALTER TABLE family_members ADD COLUMN IF NOT EXISTS gender VARCHAR")

def downgrade() -> None:
    op.execute("ALTER TABLE family_members DROP COLUMN IF EXISTS gender")
```

- [ ] **Step 4: Add `gender` to `FamilyMemberCreate`, `FamilyMemberUpdate`, `FamilyMemberResponse` in `backend/app/schemas.py`**

In each of the three classes (lines 163, 172, 181), add:

```python
    gender: Optional[str] = None
```

- [ ] **Step 5: Verify backend boots**

```bash
cd backend && python -c "from app.main import app; print('OK')"
```

- [ ] **Step 6: Commit backend gender support**

```bash
git add backend/app/models.py backend/app/schemas.py backend/alembic/versions/
git commit -m "Add gender column to family_members (F1 backend)"
```

### Task 6.2 — Frontend: install relatives-tree, build adapter

- [ ] **Step 1: Install `relatives-tree`**

```bash
cd frontend
npm install relatives-tree
```

- [ ] **Step 2: Update Photo / FamilyMember types**

In `frontend/src/types/api.ts` (line 28), add `gender`:

```ts
export interface FamilyMember { id: number; first_name: string; last_name: string | null; birth_date: string | null; death_date: string | null; bio: string | null; gender: string | null; photo_id: number | null; position_x: number; position_y: number; created_by_id: number; created_at: string }
export interface FamilyMemberCreate { first_name: string; last_name?: string; birth_date?: string; death_date?: string; bio?: string; gender?: string; position_x?: number; position_y?: number }
```

- [ ] **Step 3: Create `frontend/src/features/family-tree/lib/buildTreeData.ts`**

```ts
import type { Node as RtNode, Gender as RtGender } from 'relatives-tree/lib/types';
import type { FamilyMember, FamilyRelationship } from '@/types/api';

export interface BuiltNode extends RtNode {
  // RtNode already has id, gender, parents, children, siblings, spouses
  // We index members by id below.
}

/**
 * Convert our DB shape (members + relationships) into the relatives-tree
 * input format. Members with NULL gender default to 'male' for layout
 * purposes only — does not modify the DB.
 */
export function buildTreeData(
  members: FamilyMember[],
  relationships: FamilyRelationship[],
): BuiltNode[] {
  const byId: Record<string, BuiltNode> = {};
  for (const m of members) {
    const g = (m.gender === 'female' ? 'female' : 'male') as RtGender;
    byId[String(m.id)] = {
      id: String(m.id),
      gender: g,
      parents: [],
      children: [],
      siblings: [],
      spouses: [],
    };
  }

  for (const r of relationships) {
    const a = byId[String(r.person_a_id)];
    const b = byId[String(r.person_b_id)];
    if (!a || !b) continue;

    if (r.relationship_type === 'parent_child') {
      // person_a is the parent, person_b is the child
      a.children.push({ id: b.id, type: 'blood' });
      b.parents.push({ id: a.id, type: 'blood' });
    } else if (r.relationship_type === 'spouse') {
      a.spouses.push({ id: b.id, type: 'married' });
      b.spouses.push({ id: a.id, type: 'married' });
    } else if (r.relationship_type === 'sibling') {
      a.siblings.push({ id: b.id, type: 'blood' });
      b.siblings.push({ id: a.id, type: 'blood' });
    }
  }

  return Object.values(byId);
}

export function pickRootId(nodes: BuiltNode[], members: FamilyMember[]): string {
  // Prefer a member with no parents and at least one child (likely an ancestor)
  const rootCandidate = nodes.find((n) => n.parents.length === 0 && n.children.length > 0);
  if (rootCandidate) return rootCandidate.id;
  // Fallback: oldest by birth_date, else first member
  const sorted = [...members].sort((a, b) => {
    if (!a.birth_date) return 1;
    if (!b.birth_date) return -1;
    return a.birth_date.localeCompare(b.birth_date);
  });
  return String(sorted[0]?.id ?? members[0]?.id ?? '0');
}
```

### Task 6.3 — Frontend: rewrite TreeCanvas

- [ ] **Step 1: Rewrite `frontend/src/features/family-tree/components/TreeCanvas.tsx`**

Replace the entire file with:

```tsx
import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react';
import calcTree from 'relatives-tree';
import '@xyflow/react/dist/style.css';
import type { FamilyMember, FamilyRelationship } from '@/types/api';
import { buildTreeData, pickRootId } from '../lib/buildTreeData';

const NODE_W = 160;
const NODE_H = 80;

interface MemberNodeData {
  label: string;
  birth_date: string | null;
  death_date: string | null;
  onClick: () => void;
}

function MemberNode({ data }: { data: MemberNodeData }) {
  return (
    <div
      onClick={data.onClick}
      className="rounded-lg px-4 py-3 cursor-pointer min-w-[150px] text-center shadow-md transition-colors"
      style={{ background: '#ffffff', border: '1px solid #9ca3af' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#9ca3af')}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#9ca3af' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#9ca3af' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: '#9ca3af' }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: '#9ca3af' }} />
      <p className="text-sm font-semibold" style={{ color: '#111827' }}>{data.label}</p>
      {data.birth_date && (
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
          b. {data.birth_date.slice(0, 4)}
          {data.death_date ? ` – d. ${data.death_date.slice(0, 4)}` : ''}
        </p>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = { member: MemberNode };

const EDGE_CONFIG: Record<string, { color: string; label: string; dashed?: boolean }> = {
  parent_child: { color: '#4f46e5', label: 'parent → child' },
  spouse:       { color: '#db2777', label: 'spouse', dashed: true },
  sibling:      { color: '#059669', label: 'sibling', dashed: true },
};

function computePositions(members: FamilyMember[], relationships: FamilyRelationship[]) {
  if (members.length === 0) return new Map<string, { x: number; y: number }>();
  const nodes = buildTreeData(members, relationships);
  const rootId = pickRootId(nodes, members);
  const result = calcTree(nodes, { rootId, placeholders: false });

  const positions = new Map<string, { x: number; y: number }>();
  // relatives-tree returns positions in its own units (1 unit ≈ node width).
  // Multiply by NODE_W/NODE_H to get pixel coords.
  const SCALE_X = 100;
  const SCALE_Y = 120;
  for (const n of result.nodes) {
    positions.set(n.id, { x: n.left * SCALE_X, y: n.top * SCALE_Y });
  }
  return positions;
}

function buildNodes(
  members: FamilyMember[],
  relationships: FamilyRelationship[],
  onSelectMember: (m: FamilyMember) => void,
): Node[] {
  const positions = computePositions(members, relationships);
  return members.map((m) => {
    const auto = positions.get(String(m.id));
    // Use saved position_x/y as override if non-zero; else use auto-computed
    const useOverride = m.position_x !== 0 || m.position_y !== 0;
    const pos = useOverride
      ? { x: m.position_x, y: m.position_y }
      : auto ?? { x: 0, y: 0 };
    return {
      id: String(m.id),
      type: 'member',
      position: pos,
      data: {
        label: [m.first_name, m.last_name].filter(Boolean).join(' '),
        birth_date: m.birth_date,
        death_date: m.death_date,
        onClick: () => onSelectMember(m),
      },
    };
  });
}

function buildEdges(relationships: FamilyRelationship[]): Edge[] {
  return relationships.map((r) => {
    const cfg = EDGE_CONFIG[r.relationship_type] ?? { color: '#888', label: r.relationship_type };
    const isSpouseOrSibling = r.relationship_type === 'spouse' || r.relationship_type === 'sibling';
    return {
      id: String(r.id),
      source: String(r.person_a_id),
      target: String(r.person_b_id),
      sourceHandle: isSpouseOrSibling ? 'right' : undefined,
      targetHandle: isSpouseOrSibling ? 'left' : undefined,
      label: cfg.label,
      type: 'smoothstep',
      animated: r.relationship_type === 'spouse',
      style: {
        stroke: cfg.color,
        strokeDasharray: cfg.dashed ? '5 4' : undefined,
        strokeWidth: 2,
      },
      labelStyle: { fontSize: 10, fill: cfg.color, fontWeight: 500 },
      labelBgStyle: { fill: 'transparent' },
      markerEnd: r.relationship_type === 'parent_child'
        ? { type: MarkerType.ArrowClosed, color: cfg.color }
        : undefined,
    };
  });
}

interface TreeCanvasProps {
  members: FamilyMember[];
  relationships: FamilyRelationship[];
  onSelectMember: (m: FamilyMember) => void;
}

export function TreeCanvas({ members, relationships, onSelectMember }: TreeCanvasProps) {
  const initialNodes = useMemo(
    () => buildNodes(members, relationships, onSelectMember),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const initialEdges = useMemo(() => buildEdges(relationships), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(buildNodes(members, relationships, onSelectMember));
  }, [members, relationships, onSelectMember, setNodes]);

  useEffect(() => {
    setEdges(buildEdges(relationships));
  }, [relationships, setEdges]);

  const onNodeClick = useCallback(() => {}, []);

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden">
      <div className="h-[620px]" style={{ background: '#d1d5db' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.2}
          maxZoom={2}
          style={{ background: '#d1d5db' }}
        >
          <Background color="#9ca3af" gap={24} />
          <Controls style={{ background: '#f3f4f6', border: '1px solid #d1d5db' }} />
          <MiniMap nodeColor={() => '#6366f1'} style={{ background: '#e5e7eb' }} />
        </ReactFlow>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-[#4f46e5]" />
          Parent → Child
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 border-dashed border-t-2 border-[#db2777]" />
          Spouse
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 border-dashed border-t-2 border-[#059669]" />
          Sibling
        </span>
      </div>
    </div>
  );
}
```

(Note: `dagre` is no longer imported. NODE_W/NODE_H are kept in case you want to tweak SCALE_X/Y later for tighter or looser layout.)

- [ ] **Step 2: Add gender selector to `MemberForm.tsx`**

In `frontend/src/features/family-tree/components/MemberForm.tsx`:

a) Update the `useState` (line 17):
```tsx
const [form, setForm] = useState({
  first_name: initial?.first_name ?? '',
  last_name: initial?.last_name ?? '',
  gender: initial?.gender ?? '',
  birth_date: initial?.birth_date ?? '',
  death_date: initial?.death_date ?? '',
  bio: initial?.bio ?? '',
});
```

b) Update the `onSave` interface (line 6) to include `gender: string` in the saved data.

c) After the `last_name` input block (line 60, end of the second `space-y-1` div), add:

```tsx
<div className="space-y-1">
  <label htmlFor="gender" className="text-sm font-medium text-foreground">Gender</label>
  <select
    id="gender"
    name="gender"
    value={form.gender}
    onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
  >
    <option value="">Unspecified</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
  </select>
</div>
```

d) Verify the corresponding `MemberFormProps.onSave` callback in `FamilyTreePage.tsx` handles the new `gender` field (it should pass through to `useUpdateMember` / `useCreateMember` which forward to the backend).

- [ ] **Step 3: Add "Reset layout" button to `FamilyTreePage.tsx`**

Read `frontend/src/features/family-tree/FamilyTreePage.tsx`. Find the toolbar (likely near the top of the rendered JSX). Add a button that, when clicked with confirmation, calls a mutation to clear `position_x`/`position_y` for all members.

Implementation:
1. Add a new mutation hook in `useFamilyTree.ts` (or call the existing update endpoint in a loop):
```ts
export function useResetLayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (members: FamilyMember[]) => {
      await Promise.all(members.map((m) =>
        familyTreeApi.updateMember(m.id, { position_x: 0, position_y: 0 })
      ));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['family-members'] }),
  });
}
```

2. In `FamilyTreePage.tsx`, in the toolbar add:
```tsx
<button
  onClick={() => {
    if (!members?.length) return;
    if (confirm('Reset all members to auto-layout? This clears any manual positions.')) {
      resetLayout.mutate(members);
    }
  }}
  className="rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
  disabled={resetLayout.isPending}
>
  {resetLayout.isPending ? 'Resetting…' : 'Reset to auto-layout'}
</button>
```

(Wire `useResetLayout` import + `const resetLayout = useResetLayout();` at the top.)

- [ ] **Step 4: Frontend typecheck + lint**

Run: `cd frontend && npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit + push frontend**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/types/api.ts frontend/src/features/family-tree/
git commit -m "Swap dagre → relatives-tree for genealogy-aware layout (F1)"
git push origin main
```

- [ ] **Step 6: Wait for deploy + manual verify**

Manual:
1. mrtag.com/family-tree → tree renders with proper genealogy layout (couples horizontal, children below).
2. Drag a node — position persists across reload.
3. Click "Reset to auto-layout" → confirm → all positions return to auto.
4. Add a new member with gender = Female → appears in tree, layout updates.
5. No console errors.

---

## Wrap-up

After all six phases ship:

- [ ] **Update `docs/changelog.md`** with one bullet per feature (D1, U3, S1, P1, Q2, F1) under a new "Wave 1 — 2026-04-20" heading.
- [ ] **Tag** the merge commit (optional): `git tag wave-1 && git push origin wave-1`.

If anything regresses post-deploy:
- Identify the offending commit via `git log --oneline -10`.
- Revert: `git revert <sha> && git push origin main`.
- File a follow-up task describing the regression.
