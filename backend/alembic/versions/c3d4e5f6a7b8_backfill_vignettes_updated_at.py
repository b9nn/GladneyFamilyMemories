"""backfill vignettes.updated_at where null

The Vignette model / response schema requires updated_at to be a
datetime, but rows inserted before onupdate=func.now() fired can have
NULL. Set updated_at = created_at for those rows so the list endpoint
validates.

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-18 17:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE vignettes SET updated_at = created_at WHERE updated_at IS NULL"
    )


def downgrade() -> None:
    pass
