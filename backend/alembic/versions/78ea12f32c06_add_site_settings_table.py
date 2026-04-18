"""add site_settings table

Revision ID: 78ea12f32c06
Revises: c8e748eec8d5
Create Date: 2026-03-27 21:55:56.480059

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '78ea12f32c06'
down_revision: Union[str, None] = 'c8e748eec8d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS site_settings (
            key VARCHAR PRIMARY KEY,
            value TEXT,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS site_settings")
