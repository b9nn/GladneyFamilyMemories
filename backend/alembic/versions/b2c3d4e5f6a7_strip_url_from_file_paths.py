"""strip full presigned URLs from file_path columns

Historical data bug: earlier versions of the upload code stored the full
presigned URL in file_path instead of the bare storage key. The current
get_file_url() treats file_path as a key and generates a fresh presigned
URL — so when file_path is a URL, it gets double-wrapped and R2 returns
NoSuchKey.

This migration extracts the storage key (e.g. 'photos/abc.jpg') from any
file_path that is a URL. Idempotent: values that are already bare keys
are left untouched.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-18 17:50:00.000000

"""
from typing import Sequence, Union
from urllib.parse import urlparse

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_TABLES = ["photos", "files", "audio_recordings", "background_images"]


def _extract_key(value: str) -> str:
    """Extract the storage key from a file_path that may be a full URL.

    URL shape:
        https://<acct>.r2.cloudflarestorage.com/<bucket>/<category>/<file>?X-Amz-...
    → returns '<category>/<file>'.

    Bare keys ('photos/abc.jpg') are returned unchanged.
    """
    if not value or not value.startswith(("http://", "https://")):
        return value
    parsed = urlparse(value)
    # path is like '/<bucket>/<category>/<file>' — strip the leading slash
    # and the first path segment (the bucket name).
    path = parsed.path.lstrip("/")
    parts = path.split("/", 1)
    if len(parts) == 2:
        return parts[1]
    return path


def upgrade() -> None:
    conn = op.get_bind()
    for table in _TABLES:
        rows = conn.execute(sa.text(
            f"SELECT id, file_path FROM {table} WHERE file_path LIKE 'http%'"
        )).fetchall()
        for row_id, file_path in rows:
            new_key = _extract_key(file_path)
            if new_key != file_path:
                conn.execute(
                    sa.text(f"UPDATE {table} SET file_path = :key WHERE id = :id"),
                    {"key": new_key, "id": row_id},
                )


def downgrade() -> None:
    # Cannot restore the original presigned URLs (they were ephemeral).
    pass
