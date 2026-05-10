"""add industries JSONB to products

Adds a single JSONB column for industry tagging. Defaults to an empty
array on existing rows so the column is nullable=False but always has a
sensible value. The list of valid industry slugs lives in code (frontend
+ admin UI) rather than the DB schema, so adding a new industry later
doesn't require another migration.

Revision ID: 0004_add_product_industries
Revises: 0003_add_product_ppt
Create Date: 2026-05-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004_add_product_industries"
down_revision: Union[str, None] = "0003_add_product_ppt"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "industries",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )


def downgrade() -> None:
    op.drop_column("products", "industries")
