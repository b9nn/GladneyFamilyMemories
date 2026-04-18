"""Startup migration runner.

If the DB has tables but no alembic_version (it was bootstrapped via
create_all() before Alembic tracking existed), stamp it with the baseline
revision so alembic upgrade head applies only the newer migrations.
Otherwise, upgrade normally.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, inspect, text

BASELINE_REVISION = "c8e748eec8d5"


def _normalize(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and "+psycopg" not in url:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def main() -> int:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("[migrate] DATABASE_URL unset — skipping (dev/sqlite mode)")
        return 0

    engine = create_engine(_normalize(db_url), pool_pre_ping=True)
    insp = inspect(engine)
    tables = set(insp.get_table_names())

    has_alembic = "alembic_version" in tables
    has_core_tables = "users" in tables

    if has_core_tables and not has_alembic:
        print(f"[migrate] Core tables exist but no alembic_version — stamping {BASELINE_REVISION}")
        with engine.begin() as conn:
            conn.execute(text(
                "CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
            ))
            conn.execute(
                text("INSERT INTO alembic_version (version_num) VALUES (:v)"),
                {"v": BASELINE_REVISION},
            )
        print("[migrate] Baseline stamped")

    # Run alembic upgrade head from the backend directory (where alembic.ini lives)
    backend_dir = Path(__file__).resolve().parent.parent
    os.chdir(backend_dir)
    rc = os.system("alembic upgrade head")
    return rc >> 8 if rc else 0


if __name__ == "__main__":
    sys.exit(main())
