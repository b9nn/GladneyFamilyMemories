# Action Plan - Two-Server Setup with Shared Database

## Goal

Keep the new two-server architecture but make sure:
- ✅ All users and data are in ONE database (shared)
- ✅ Files persist across deployments (cloud storage)
- ✅ Everything works together

---

## Step 1: Connect Backend to Existing Database (5 minutes)

### What to Do

1. Go to Render dashboard: https://dashboard.render.com
2. Open your **gladney-family-memories** service (the old one)
3. Click **Environment** tab
4. Find and **copy** these values:
   - `DATABASE_URL`
   - `SECRET_KEY`

5. Now open your **gladney-family-backend** service (the new one)
6. Click **Environment** tab
7. Add or update these variables with the **exact same values**:
   - `DATABASE_URL` = (paste from step 4)
   - `SECRET_KEY` = (paste from step 4)

8. Click **Save Changes**
9. Backend will automatically redeploy (takes 2-3 minutes)

### Why This Matters

**CRITICAL**: The `SECRET_KEY` MUST be the same on both servers, or JWT tokens won't work and users can't log in.

Both servers will now read/write to the **same PostgreSQL database**, so:
- Users created on one server appear on both
- Uploads tracked in one place
- No data split

---

## Step 2: Set Up Cloud Storage (10 minutes)

### Why

Right now files are stored on Render's filesystem, which **deletes everything on each deployment**.

### What to Do

Follow the guide I created: [CLOUDFLARE_R2_SETUP.md](CLOUDFLARE_R2_SETUP.md)

**Quick version:**
1. Create free Cloudflare account
2. Create R2 bucket called `gladney-family-photos`
3. Get API credentials
4. Add 5 environment variables to **gladney-family-backend**:
   - `USE_CLOUD_STORAGE=true`
   - `S3_ENDPOINT_URL=...`
   - `S3_ACCESS_KEY_ID=...`
   - `S3_SECRET_ACCESS_KEY=...`
   - `S3_BUCKET_NAME=gladney-family-photos`

5. Redeploy backend

### After This

- All new uploads go to R2 (persist forever)
- Old uploads on filesystem will be lost on next deployment (see Step 4 for migration)

---

## Step 3: Verify Everything Works (2 minutes)

### Test Backend

```bash
# Should show your 2 users (ben, TAG1)
curl -s https://gladney-family-backend.onrender.com/api/auth/health
```

Expected output:
```json
{
  "status": "ok",
  "database": "connected",
  "user_count": 2
}
```

### Test Login

1. Go to https://mrtag.com
2. Log in as:
   - Username: `ben`
   - Password: `Claudesaves88`

3. Should work! If not, check Step 1 again.

---

## Step 4: Migrate Existing Files (Optional)

If you have photos/files already uploaded that you want to keep:

### Option A: Let Them Go (Easiest)

- Just accept they'll be lost on next deployment
- Start fresh with R2
- Re-upload if needed

### Option B: Migrate Them (I'll Help)

Tell me and I'll create a Python script that:
1. Downloads all files from Render's filesystem
2. Uploads them to R2
3. Updates database records with new R2 URLs

---

## Step 5: Decide What to Do with Old Server (Optional)

You now have two backend servers:

1. **gladney-family-memories** (old single-server) - Still running
2. **gladney-family-backend** (new backend only) - Being used

### Options

**A. Keep old server running** (backup)
- Costs nothing (free tier)
- Good fallback if something breaks
- Can delete later

**B. Delete old server**
- Frees up your free tier slot
- One less thing to manage
- **Make sure new setup works first!**

I recommend **keeping it for now** as a backup, delete it in a week once you're confident everything works.

---

## Your Current Render Setup After This

```
┌─────────────────────────────────────────┐
│  Frontend (Static HTML/JS)              │
│  Location: mrtag.com                    │
│  Served by: gladney-family-memories     │
│  (or could move to separate static site)│
└─────────────────┬───────────────────────┘
                  │
                  │ API calls to
                  ↓
┌─────────────────────────────────────────┐
│  Backend (FastAPI)                      │
│  gladney-family-backend.onrender.com    │
│  - Handles API requests                 │
│  - Uploads files to R2                  │
│  - Reads/writes database                │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ↓                 ↓
┌─────────────┐   ┌──────────────┐
│ PostgreSQL  │   │ Cloudflare   │
│ Database    │   │ R2 Storage   │
│ (Render)    │   │ (Files)      │
└─────────────┘   └──────────────┘
```

---

## Summary Checklist

- [ ] Step 1: Connect new backend to existing database (copy DATABASE_URL and SECRET_KEY)
- [ ] Step 2: Set up Cloudflare R2 for file storage
- [ ] Step 3: Test login works at mrtag.com
- [ ] Step 4: (Optional) Migrate existing files
- [ ] Step 5: (Later) Delete old server once confident

---

## Time Estimate

- **Minimum setup**: 10 minutes (Steps 1 & 3 only)
- **With cloud storage**: 20 minutes (Steps 1, 2, & 3)
- **Full migration**: 30 minutes (All steps)

---

## Need Help?

If you get stuck on any step, share:
1. Which step you're on
2. Any error messages
3. Screenshot of Render environment variables (blur secrets)

Let me know when you're ready to start!
