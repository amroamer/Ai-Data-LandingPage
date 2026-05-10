"""initial schema: users, app_access, products, settings

Captures the schema previously created via ``Base.metadata.create_all``.
First-time deploys run this migration to create all four tables; existing
deploys (where the tables already exist from the pre-Alembic era) get the
revision stamped by the entrypoint script so this migration is a no-op.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-05-05
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("admin", "user", name="userrole"),
            nullable=False,
            server_default="user",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "app_access",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("app_slug", sa.String(length=50), nullable=False),
        sa.Column("has_access", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "granted_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("granted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name="fk_app_access_user_id"
        ),
        sa.ForeignKeyConstraint(
            ["granted_by"], ["users.id"], ondelete="SET NULL", name="fk_app_access_granted_by"
        ),
        sa.UniqueConstraint("user_id", "app_slug", name="uq_user_app"),
    )
    op.create_index("ix_app_access_app_slug", "app_access", ["app_slug"])

    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column(
            "icon_name", sa.String(length=60), nullable=False, server_default="Package"
        ),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("video_url", sa.String(length=500), nullable=True),
        sa.Column(
            "screenshots",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("is_visible", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("title_en", sa.String(length=200), nullable=False),
        sa.Column("title_ar", sa.String(length=200), nullable=False),
        sa.Column("description_en", sa.Text(), nullable=False, server_default=""),
        sa.Column("description_ar", sa.Text(), nullable=False, server_default=""),
        sa.Column("problem_en", sa.Text(), nullable=False, server_default=""),
        sa.Column("problem_ar", sa.Text(), nullable=False, server_default=""),
        sa.Column("solution_en", sa.Text(), nullable=False, server_default=""),
        sa.Column("solution_ar", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_products_slug", "products", ["slug"], unique=True)

    op.create_table(
        "settings",
        sa.Column("key", sa.String(length=100), primary_key=True),
        sa.Column("value", sa.String(length=500), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["updated_by"], ["users.id"], ondelete="SET NULL", name="fk_settings_updated_by"
        ),
    )


def downgrade() -> None:
    op.drop_table("settings")
    op.drop_index("ix_products_slug", table_name="products")
    op.drop_table("products")
    op.drop_index("ix_app_access_app_slug", table_name="app_access")
    op.drop_table("app_access")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    sa.Enum(name="userrole").drop(op.get_bind(), checkfirst=False)
