"""Add page_access to users and invite_codes

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-05-03 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op

revision: str = 'h8i9j0k1l2m3'
down_revision: Union[str, None] = 'g7h8i9j0k1l2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS page_access VARCHAR')
    op.execute('ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS page_access VARCHAR')


def downgrade() -> None:
    pass
