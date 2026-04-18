"""add sort_order to album_photos

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-18

"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('album_photos', sa.Column('sort_order', sa.Integer(), nullable=True, server_default='0'))


def downgrade() -> None:
    op.drop_column('album_photos', 'sort_order')
