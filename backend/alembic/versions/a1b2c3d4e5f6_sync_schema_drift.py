"""sync schema drift — ensure all model columns exist

Idempotent: uses ADD COLUMN IF NOT EXISTS so it's safe on any prod DB,
whether the column already exists or not. Covers columns that were
added to models after the DB was first created via create_all().

Revision ID: a1b2c3d4e5f6
Revises: 78ea12f32c06
Create Date: 2026-04-18 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '78ea12f32c06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Every nullable / defaulted column in the current models.
# Running ADD COLUMN IF NOT EXISTS on Postgres is a no-op when the
# column already exists, so this is safe to run against any prod state.
_COLUMNS = [
    # users
    ("users", "email", "VARCHAR"),
    ("users", "full_name", "VARCHAR"),
    ("users", "is_admin", "BOOLEAN"),
    ("users", "is_active", "BOOLEAN"),
    ("users", "reset_token", "VARCHAR"),
    ("users", "reset_token_expires", "TIMESTAMP WITH TIME ZONE"),

    # invite_codes
    ("invite_codes", "email", "VARCHAR"),
    ("invite_codes", "used_by_id", "INTEGER"),
    ("invite_codes", "expires_at", "TIMESTAMP WITH TIME ZONE"),

    # vignettes
    ("vignettes", "content", "TEXT"),
    ("vignettes", "sort_order", "INTEGER"),
    ("vignettes", "updated_at", "TIMESTAMP WITH TIME ZONE"),

    # photos
    ("photos", "title", "VARCHAR"),
    ("photos", "description", "TEXT"),
    ("photos", "taken_at", "TIMESTAMP WITH TIME ZONE"),
    ("photos", "sort_order", "INTEGER"),

    # vignette_photos
    ("vignette_photos", "position", "INTEGER"),

    # albums
    ("albums", "description", "TEXT"),
    ("albums", "sort_order", "INTEGER"),
    ("albums", "background_image", "VARCHAR"),

    # audio_recordings
    ("audio_recordings", "title", "VARCHAR"),
    ("audio_recordings", "description", "TEXT"),
    ("audio_recordings", "duration_seconds", "FLOAT"),

    # files — extracted_text is the known-missing column blocking prod
    ("files", "title", "VARCHAR"),
    ("files", "description", "TEXT"),
    ("files", "file_type", "VARCHAR"),
    ("files", "source", "VARCHAR"),
    ("files", "extracted_text", "TEXT"),

    # background_images
    ("background_images", "is_active", "BOOLEAN"),

    # family_members
    ("family_members", "last_name", "VARCHAR"),
    ("family_members", "birth_date", "VARCHAR"),
    ("family_members", "death_date", "VARCHAR"),
    ("family_members", "bio", "TEXT"),
    ("family_members", "photo_id", "INTEGER"),
    ("family_members", "position_x", "FLOAT"),
    ("family_members", "position_y", "FLOAT"),
]


def upgrade() -> None:
    for table, col, col_type in _COLUMNS:
        op.execute(f'ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}')


def downgrade() -> None:
    # No-op — we can't safely know which columns this migration actually added
    # vs. which already existed. Leaving downgrade as a no-op is the correct
    # behavior for a schema-sync migration.
    pass
