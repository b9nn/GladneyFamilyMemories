# Restore Environment Variables to gladney-family-backend

## All Environment Variables to Add

Copy these to your **gladney-family-backend** service in Render:

### 1. Database Connection
```
DATABASE_URL=postgresql://gladney_memories_db_user:xPyIX5Z8xzmv1UJvnPZpk64Z9kfViUDMadpg-d58a4oshg0os73bmgchg-a/gladney_memories_db
```

### 2. Security
```
SECRET_KEY=7512cdacedc3a31dc625a7bd91bd91c7
```

### 3. Cloud Storage (Cloudflare R2)
```
USE_CLOUD_STORAGE=true

S3_ENDPOINT_URL=https://cbc6d147d5c16c705889592e7022a4f.r2.cloudflarestorage.com/

S3_ACCESS_KEY_ID=439b5177ca2c4fc197e53fe57dfab9b5

S3_SECRET_ACCESS_KEY=81688997a6b2a9e2422b4dd8cecc6c179bee6cac9773e3625026d4453db26341

S3_BUCKET_NAME=gladneyfamilymemories
```

### 4. Email Configuration (SMTP)
```
FROM_EMAIL=tgladney@gmail.com

FROM_NAME=Lorna and Tom's Memories

SMTP_USER=tgladney@gmail.com

SMTP_PASSWORD=ynjarmtqumzmhttf
```

### 5. Site Configuration
```
SITE_URL=mrtag.com
```

---

## How to Add Them in Render Dashboard

1. Go to https://dashboard.render.com
2. Click on **gladney-family-backend** service
3. Click **Environment** tab on the left
4. Click **Add Environment Variable** button

For EACH variable above:
- Paste the **Key** (left side before `=`)
- Paste the **Value** (right side after `=`)
- Click **Save Changes**

Repeat for all 11 variables.

---

## Quick Copy-Paste Format

Here they are in a format you can copy one at a time:

**Variable 1:**
- Key: `DATABASE_URL`
- Value: `postgresql://gladney_memories_db_user:xPyIX5Z8xzmv1UJvnPZpk64Z9kfViUDMadpg-d58a4oshg0os73bmgchg-a/gladney_memories_db`

**Variable 2:**
- Key: `SECRET_KEY`
- Value: `7512cdacedc3a31dc625a7bd91bd91c7`

**Variable 3:**
- Key: `USE_CLOUD_STORAGE`
- Value: `true`

**Variable 4:**
- Key: `S3_ENDPOINT_URL`
- Value: `https://cbc6d147d5c16c705889592e7022a4f.r2.cloudflarestorage.com/`

**Variable 5:**
- Key: `S3_ACCESS_KEY_ID`
- Value: `439b5177ca2c4fc197e53fe57dfab9b5`

**Variable 6:**
- Key: `S3_SECRET_ACCESS_KEY`
- Value: `81688997a6b2a9e2422b4dd8cecc6c179bee6cac9773e3625026d4453db26341`

**Variable 7:**
- Key: `S3_BUCKET_NAME`
- Value: `gladneyfamilymemories`

**Variable 8:**
- Key: `FROM_EMAIL`
- Value: `tgladney@gmail.com`

**Variable 9:**
- Key: `FROM_NAME`
- Value: `Lorna and Tom's Memories`

**Variable 10:**
- Key: `SMTP_USER`
- Value: `tgladney@gmail.com`

**Variable 11:**
- Key: `SMTP_PASSWORD`
- Value: `ynjarmtqumzmhttf`

**Variable 12:**
- Key: `SITE_URL`
- Value: `mrtag.com`

---

## After Adding All Variables

1. Click **Save Changes** (Render will auto-redeploy)
2. Wait 2-3 minutes for deployment to complete
3. Test with:
   ```bash
   curl https://gladney-family-backend.onrender.com/api/auth/health
   ```

Should show:
```json
{
  "status": "ok",
  "database": "connected",
  "user_count": 2
}
```

---

## Important Notes

⚠️ **DATABASE_URL** - This connects to your PostgreSQL database with all your data (users, vignettes, photos)

⚠️ **SECRET_KEY** - Must be exactly this value or JWT tokens won't work and users can't log in

⚠️ **R2 Credentials** - Without these, file uploads will fail

⚠️ **SMTP** - Password is a Gmail app password for sending invite emails
