# Deploy Runbook — Fly.io + Supabase + Cloudflare R2

One-time setup. Follow in order.

## 1. Provision services

### Supabase (Postgres)
1. Create project at https://supabase.com → region close to `iad` (e.g., us-east-1).
2. Settings → Database → **Connection pooling** → copy the **Transaction** URI.
3. Append `?sslmode=require` if not present. This is your `DATABASE_URL`.

### Cloudflare R2 (media)
1. Create bucket `gladney-family-media` (see `CLOUDFLARE_R2_SETUP.md`).
2. Create an S3 API token with read/write on that bucket.
3. Enable public bucket access OR connect a custom subdomain (e.g. `media.mrtag.com`).

## 2. Migrate data (if restoring from a prior Postgres host)

From a machine with `pg_dump` / `psql` installed:

```bash
# Dump existing prod DB
pg_dump --no-owner --no-acl --clean --if-exists \
  "postgresql://USER:PASS@HOST/DB" > prod_dump.sql

# Restore into Supabase (use the DIRECT connection URI, not the pooler, for restore)
psql "postgresql://postgres:PASS@db.xxxx.supabase.co:5432/postgres?sslmode=require" \
  < prod_dump.sql

# Verify row counts
psql "$SUPABASE_URL" -c "SELECT count(*) FROM users;"
```

## 3. Local smoke test

```bash
cp .env.example .env.local   # then fill in real values
docker build -t gladney .
docker run --rm -p 8000:8000 --env-file .env.local gladney
# visit http://localhost:8000 → log in as existing user
```

## 4. Fly.io deploy

```bash
# Install flyctl once: https://fly.io/docs/hands-on/install-flyctl/
fly auth login
fly launch --no-deploy --copy-config    # accept existing fly.toml

# Set secrets (values from Supabase + R2)
fly secrets set \
  DATABASE_URL="..." \
  SECRET_KEY="..." \
  USE_CLOUD_STORAGE=true \
  S3_ENDPOINT_URL="..." \
  S3_ACCESS_KEY_ID="..." \
  S3_SECRET_ACCESS_KEY="..." \
  S3_BUCKET_NAME=gladney-family-media \
  S3_PUBLIC_URL="..."

fly deploy
fly logs    # watch startup
```

## 5. Custom domain

```bash
fly certs add mrtag.com
fly certs add www.mrtag.com
# Follow the DNS records fly prints (A/AAAA or CNAME). Update at your DNS host.
fly certs show mrtag.com    # wait until "Configured"
```

## 6. GitHub Actions auto-deploy

```bash
fly tokens create deploy -a gladney-family-tree   # copy output
```

In GitHub → repo Settings → Secrets → Actions → new secret `FLY_API_TOKEN` = that token.
Now every push to `main` auto-deploys via `.github/workflows/deploy.yml`.

## Verification checklist

- [ ] `https://mrtag.com/` loads the SPA
- [ ] Existing user can log in (DB migrated)
- [ ] Uploading a photo returns a URL on the R2 domain (not `/uploads/...`)
- [ ] `fly deploy` a trivial change → uploaded photo still loads
- [ ] Supabase dashboard shows daily backup snapshot
- [ ] Push to `main` triggers GH Actions deploy successfully
