"""Add source column to photos; tag existing wedding photos

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
Create Date: 2026-05-18 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op

revision: str = 'j0k1l2m3n4o5'
down_revision: Union[str, None] = 'i9j0k1l2m3n4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE photos ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'photos'")
    op.execute("""
        UPDATE photos SET source = 'wedding'
        WHERE id IN (
            SELECT photo_id FROM album_photos
            WHERE album_id IN (SELECT id FROM albums WHERE is_wedding = true)
        )
    """)


def downgrade() -> None:
    pass
