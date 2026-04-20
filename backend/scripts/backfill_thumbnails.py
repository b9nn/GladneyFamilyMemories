"""One-shot: generate _thumb.jpg + _med.jpg variants for every existing photo
that doesn't already have them. Idempotent — safe to re-run.

Usage:
    flyctl ssh console --app gladney-family-tree -C "python scripts/backfill_thumbnails.py"
"""
from __future__ import annotations

import sys
from pathlib import Path

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
                print(f"  OK   id={p.id} -> {thumb_key}, {med_key}")
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
