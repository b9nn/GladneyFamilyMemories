"""set default CURRENT_TIMESTAMP on vignettes.updated_at

The sync_schema_drift migration added vignettes.updated_at without a
DB-side default. The Vignette model declares server_default=func.now()
which means SQLAlchemy expects the DB to populate the value on INSERT
— so without the default, new vignettes get updated_at = NULL, which
then fails VignetteResponse(updated_at: datetime) validation with 500.

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-04-18 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE vignettes ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP"
    )
    op.execute(
        "UPDATE vignettes SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE vignettes ALTER COLUMN updated_at DROP DEFAULT")
