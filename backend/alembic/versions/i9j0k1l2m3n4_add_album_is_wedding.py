"""Add is_wedding to albums

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-05-18 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op

revision: str = 'i9j0k1l2m3n4'
down_revision: Union[str, None] = 'h8i9j0k1l2m3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('ALTER TABLE albums ADD COLUMN IF NOT EXISTS is_wedding BOOLEAN DEFAULT FALSE')


def downgrade() -> None:
    pass
