"""add gender to family_members

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-04-18

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE family_members ADD COLUMN IF NOT EXISTS gender VARCHAR")


def downgrade() -> None:
    op.execute("ALTER TABLE family_members DROP COLUMN IF EXISTS gender")
