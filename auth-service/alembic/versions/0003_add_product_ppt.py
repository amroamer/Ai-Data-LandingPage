"""add ppt_filename + ppt_data to products

Adds storage for an optional sample PowerPoint per product. Both columns
are nullable because most products won't have a deck to share, and we
don't want to force admins to upload one. The data column is plain TEXT
(holding a base64 data URI) rather than BYTEA so it round-trips through
JSON-only API calls without encoding fuss; SQLAlchemy's `deferred=True`
on the model side keeps it out of normal SELECT queries.

Revision ID: 0003_add_product_ppt
Revises: 0002_phases_deliverables
Create Date: 2026-05-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_add_product_ppt"
down_revision: Union[str, None] = "0002_phases_deliverables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("ppt_filename", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("ppt_data", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("products", "ppt_data")
    op.drop_column("products", "ppt_filename")
