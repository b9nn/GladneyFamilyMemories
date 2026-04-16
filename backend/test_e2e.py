"""End-to-end check: Supabase Postgres + Cloudflare R2.

Reads backend/.env, then:
  1. Connects to Supabase, lists tables, counts rows in `users`.
  2. Uploads a tiny test object to R2, downloads it, verifies bytes, deletes it.

Run from repo root:  python backend/test_e2e.py
"""

import io
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv

ENV_PATH = Path(__file__).parent / ".env"
load_dotenv(ENV_PATH)


def prompt_if_missing(key: str, label: str = None):
    """Read from env, else prompt on stdin. Supports piped input."""
    if os.getenv(key):
        return os.getenv(key)
    label = label or key
    val = input(f"{label}: ").strip()
    os.environ[key] = val
    return val


REQUIRED = [
    ("DATABASE_URL", "Supabase pooler URL (postgresql://...)"),
    ("S3_ENDPOINT_URL", "R2 endpoint (https://<acct>.r2.cloudflarestorage.com)"),
    ("S3_ACCESS_KEY_ID", "R2 access key id"),
    ("S3_SECRET_ACCESS_KEY", "R2 secret access key"),
    ("S3_BUCKET_NAME", "R2 bucket name"),
]
for k, lbl in REQUIRED:
    prompt_if_missing(k, lbl)

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def ok(msg): print(f"{GREEN}[OK]{RESET} {msg}")
def fail(msg): print(f"{RED}[FAIL]{RESET} {msg}")
def info(msg): print(f"{YELLOW}[..]{RESET} {msg}")


def test_supabase() -> bool:
    info("Connecting to Supabase Postgres...")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        fail("DATABASE_URL not set in backend/.env")
        return False

    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)

    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(db_url, connect_args={"prepare_threshold": None})
        with engine.connect() as conn:
            version = conn.execute(text("SELECT version()")).scalar()
            ok(f"Connected. {version.split(',')[0]}")

            tables = conn.execute(text(
                "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
            )).scalars().all()
            ok(f"Found {len(tables)} public tables: {', '.join(tables) or '(none)'}")

            if "users" in tables:
                n = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
                ok(f"users table has {n} row(s)")
            else:
                fail("`users` table missing — backend init_db() may not have run")
                return False
        return True
    except Exception as e:
        fail(f"Supabase check failed: {e}")
        return False


def test_r2() -> bool:
    info("Connecting to Cloudflare R2...")
    required = ["S3_ENDPOINT_URL", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET_NAME"]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        fail(f"Missing R2 env vars: {missing}")
        return False

    try:
        import boto3
        from botocore.client import Config
        client = boto3.client(
            "s3",
            endpoint_url=os.getenv("S3_ENDPOINT_URL"),
            aws_access_key_id=os.getenv("S3_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("S3_SECRET_ACCESS_KEY"),
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )
        bucket = os.getenv("S3_BUCKET_NAME")

        client.head_bucket(Bucket=bucket)
        ok(f"Bucket `{bucket}` reachable")

        key = f"e2e-test/{uuid.uuid4().hex}.txt"
        payload = b"gladney-e2e-test"
        client.put_object(Bucket=bucket, Key=key, Body=payload, ContentType="text/plain")
        ok(f"Uploaded {len(payload)} bytes to {key}")

        got = client.get_object(Bucket=bucket, Key=key)["Body"].read()
        if got != payload:
            fail(f"Round-trip mismatch: got {got!r}")
            return False
        ok("Downloaded and verified bytes match")

        client.delete_object(Bucket=bucket, Key=key)
        ok("Deleted test object")
        return True
    except Exception as e:
        fail(f"R2 check failed: {e}")
        return False


if __name__ == "__main__":
    print(f"\n=== Supabase ===")
    s = test_supabase()
    print(f"\n=== Cloudflare R2 ===")
    r = test_r2()
    print()
    if s and r:
        ok("All checks passed.")
        sys.exit(0)
    fail("One or more checks failed.")
    sys.exit(1)
