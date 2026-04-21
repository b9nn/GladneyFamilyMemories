"""add sort_order to files

Revision ID: g7h8i9j0k1l2
Revises: f6a7b8c9d0e1
Create Date: 2026-04-21

"""
from alembic import op
import sqlalchemy as sa

revision = 'g7h8i9j0k1l2'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('files', sa.Column('sort_order', sa.Integer(), nullable=True, server_default='0'))
    op.execute('UPDATE files SET sort_order = 0 WHERE sort_order IS NULL')
    op.alter_column('files', 'sort_order', nullable=False, server_default='0')


def downgrade() -> None:
    op.drop_column('files', 'sort_order')
