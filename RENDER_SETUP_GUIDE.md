# Render Setup Guide - Gladney Family Memories

## 🚨 IMPORTANT: Architecture Changed

Your contributor changed the deployment architecture from **single-server** to **two-server** setup:
- **Before**: Backend served frontend (all from one service)
- **Now**: Separate frontend and backend services

**Frontend `.env.production` now points to**: `https://gladney-family-backend.onrender.com`

## Current Issues to Fix

1. ❌ Your `render.yaml` is configured for single-server deployment
2. ❌ Frontend expects backend at `gladney-family-backend.onrender.com`
3. ❌ New code uses cloud storage (boto3) which needs configuration
4. ❌ You need to decide: Separate servers OR single server?

---

## Option 1: Keep Single-Server (RECOMMENDED - Free Tier)

This is **simpler and uses only 1 free service** instead of 2.

### Step 1: Update Frontend Configuration

Change [frontend/.env.production](frontend/.env.production):
```bash
# Production API URL - leave empty to use same-origin (single-server deployment)
# VITE_API_URL=
```

**Remove or comment out** the `VITE_API_URL` line so frontend uses same domain as backend.

### Step 2: Keep Current render.yaml

Your current `render.yaml` is already configured correctly for single-server:
```yaml
services:
  - type: web
    name: gladney-family-memories
    env: python
    region: oregon
    plan: free
    buildCommand: |
      pip install -r backend/requirements.txt
      cd frontend && npm install && npm run build && cd ..
    startCommand: "cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        sync: false
      - key: PYTHON_VERSION
        value: 3.11.0
```

### Step 3: Required Environment Variables in Render Dashboard

Go to your Render service dashboard and set these:

**Required:**
- `SECRET_KEY` - (auto-generated, leave as is)
- `DATABASE_URL` - Your PostgreSQL connection string

**Optional (for Cloud Storage - R2/S3):**
- `USE_CLOUD_STORAGE` - Set to `true` to enable cloud storage
- `S3_ENDPOINT_URL` - e.g., `https://<account-id>.r2.cloudflarestorage.com`
- `S3_ACCESS_KEY_ID` - Your R2/S3 access key
- `S3_SECRET_ACCESS_KEY` - Your R2/S3 secret key
- `S3_BUCKET_NAME` - Your bucket name
- `S3_PUBLIC_URL` - e.g., `https://files.yourdomain.com` (optional)

**If you DON'T set cloud storage vars**, the app will automatically fall back to local storage (files stored on Render's filesystem).

### Step 4: Deploy

```bash
git add frontend/.env.production
git commit -m "Revert to single-server deployment"
git push
```

Render will auto-deploy.

### Step 5: Access Your Site

Your site will be at: `https://mrtag.com` (or `https://gladney-family-memories.onrender.com`)

---

## Option 2: Two-Server Setup (Uses 2 Free Services)

If you want to keep the contributor's architecture:

### Step 1: Create Two Render Services

#### Service 1: Backend API
- **Name**: `gladney-family-backend`
- **Type**: Web Service
- **Environment**: Python
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `SECRET_KEY` (auto-generate)
  - `DATABASE_URL` (your PostgreSQL URL)
  - All cloud storage vars (optional)

#### Service 2: Frontend Static Site
- **Name**: `gladney-family-frontend`
- **Type**: Static Site
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/dist`

### Step 2: Update Frontend .env.production

Keep it as:
```bash
VITE_API_URL=https://gladney-family-backend.onrender.com
```

### Step 3: Update Backend CORS

Make sure your backend [app/main.py](backend/app/main.py) allows the frontend domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://mrtag.com",
        "https://mrtag.com",
        "https://gladney-family-frontend.onrender.com",  # Add this
    ],
    # ... rest of CORS config
)
```

### Step 4: Custom Domain Setup

If using `mrtag.com`:
- Point DNS to the **frontend** service
- Backend remains at `gladney-family-backend.onrender.com`

---

## Cloud Storage Setup (Optional)

The new code supports cloud storage via Cloudflare R2, AWS S3, or compatible services.

### Why Use Cloud Storage?

- **Render's filesystem is ephemeral** - files disappear on redeployment
- Cloud storage persists forever
- Better for production

### Cloudflare R2 Setup (Recommended - Free 10GB)

1. **Create R2 Bucket**: https://dash.cloudflare.com/r2
2. **Get Credentials**: Create API token with R2 read/write
3. **Add to Render Environment Variables**:
   ```
   USE_CLOUD_STORAGE=true
   S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
   S3_ACCESS_KEY_ID=<your-key>
   S3_SECRET_ACCESS_KEY=<your-secret>
   S3_BUCKET_NAME=gladney-family-photos
   S3_PUBLIC_URL=https://files.yourdomain.com  (optional)
   ```

### Without Cloud Storage

Files will be stored in Render's filesystem at `/uploads/`. **These will be deleted on every deployment**, so not recommended for production.

---

## My Recommendation

**Use Option 1 (Single-Server)** because:

✅ Simpler setup
✅ Uses only 1 free Render service (save the other for future projects)
✅ No CORS complications
✅ Your current render.yaml already configured correctly
✅ Everything works from one domain

**Add Cloudflare R2** for file storage:
- 10GB free forever
- Files persist across deployments
- Takes 10 minutes to setup

---

## Quick Fix Steps (for Single-Server)

```bash
# 1. Fix frontend config
cd frontend
# Edit .env.production and remove/comment the VITE_API_URL line

# 2. Commit and push
git add .env.production
git commit -m "Revert to single-server deployment"
git push

# 3. Wait for Render to deploy (2-3 minutes)

# 4. Test at https://mrtag.com
```

---

## Checking Your Setup

### Is it working?

1. Go to `https://mrtag.com`
2. Open browser console (F12)
3. Look for API calls - they should go to the **same domain**, not a different backend URL

### Current State

Based on your `.env.production`, your frontend is trying to call:
- `https://gladney-family-backend.onrender.com/api/...`

But you only have **one Render service** at `mrtag.com`, so API calls are **failing**.

---

## Need Help?

Run these commands and share the output:

```bash
# Check frontend config
cat frontend/.env.production

# Check what's deployed
curl -s https://mrtag.com/api/auth/health | jq

# Check if backend exists
curl -s https://gladney-family-backend.onrender.com/api/auth/health | jq
```

Let me know what you prefer and I'll help you get it set up!
