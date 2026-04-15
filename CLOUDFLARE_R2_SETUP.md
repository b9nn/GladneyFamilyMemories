# Cloudflare R2 Setup Guide

## Why You Need This

**Problem**: Fly.io machine filesystems are ephemeral - every time you deploy, any uploaded photos/files written to local disk are lost.

**Solution**: Store files in Cloudflare R2 (like AWS S3, but free and faster).

## Benefits

- Free 10GB storage forever
- Files persist across deployments
- Faster file serving
- No host storage limits

---

## Step-by-Step Setup

### 1. Create Cloudflare Account

Go to: https://dash.cloudflare.com/sign-up

(Free tier is fine)

### 2. Create R2 Bucket

1. In Cloudflare Dashboard, click **R2** in left sidebar
2. Click **Create bucket**
3. Name it: `gladney-family-photos`
4. Location: Automatic (or choose closest to Oregon)
5. Click **Create bucket**

### 3. Get API Credentials

1. In R2 section, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Token name: `gladney-family-app`
4. Permissions: **Object Read & Write**
5. Bucket: Select `gladney-family-photos` (or "Apply to all buckets")
6. Click **Create API Token**

**SAVE THESE** (you can only see them once):
- Access Key ID: `abc123...`
- Secret Access Key: `xyz789...`

### 4. Get Your Account ID

1. Still in R2 section, look at the top
2. You'll see: `Account ID: a1b2c3d4...`
3. Copy this

### 5. Make Bucket Public (Optional but Recommended)

This allows files to be accessed via direct URLs.

1. Click on your bucket name
2. Go to **Settings** tab
3. Scroll to **Public access**
4. Click **Connect Domain** or **Allow Access**
5. Cloudflare will give you a public URL like:
   - `https://pub-abc123.r2.dev`

### 6. Set Fly.io Secrets

Set these as Fly.io secrets on the backend app (`gladney-family-tree`):

```bash
fly secrets set \
  USE_CLOUD_STORAGE=true \
  S3_ENDPOINT_URL=https://ACCOUNT_ID.r2.cloudflarestorage.com \
  S3_ACCESS_KEY_ID=your_access_key_from_step_3 \
  S3_SECRET_ACCESS_KEY=your_secret_key_from_step_3 \
  S3_BUCKET_NAME=gladney-family-photos \
  S3_PUBLIC_URL=https://pub-abc123.r2.dev
```

- Replace `ACCOUNT_ID` with your actual account ID from step 4.
- `S3_PUBLIC_URL` is optional - use the public URL from step 5 if you set it up.

**Example values:**
```
USE_CLOUD_STORAGE=true
S3_ENDPOINT_URL=https://a1b2c3d4e5f6g7h8.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=abc123def456
S3_SECRET_ACCESS_KEY=xyz789uvw012
S3_BUCKET_NAME=gladney-family-photos
S3_PUBLIC_URL=https://pub-xyz789abc123.r2.dev
```

### 7. Redeploy Backend

`fly secrets set` triggers a rolling redeploy automatically. If you need to force one, run `fly deploy`.

---

## Testing

1. Log in to https://mrtag.com
2. Upload a photo
3. Check Cloudflare R2 dashboard - you should see the file appear in your bucket!
4. Redeploy your app - the photo should still be there (not deleted)

---

## What About Existing Photos?

**Any photos still on the Fly.io machine's local filesystem** will be lost on next deployment.

**Options:**

1. **Let them go** - Start fresh with R2 (simplest)
2. **Migrate them** - I can write a script to copy existing files to R2 before they're lost

If you want to migrate existing photos, let me know and I'll create a migration script.

---

## Cost

**Cloudflare R2 Free Tier:**
- 10 GB storage
- 1 million Class A operations/month (uploads)
- 10 million Class B operations/month (downloads)

Your family website will **never exceed this** unless you upload thousands of HD videos.

---

## Troubleshooting

**"Failed to upload file"**
- Check your credentials via `fly secrets list` (values aren't shown, but names should all be present)
- Make sure endpoint URL includes your account ID
- Verify bucket name is correct

**"Files not showing up"**
- If you set S3_PUBLIC_URL, make sure bucket is publicly accessible
- Check browser console for CORS errors

**"Bucket not found"**
- Double-check bucket name spelling in S3_BUCKET_NAME variable
