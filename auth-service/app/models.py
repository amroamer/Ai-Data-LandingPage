import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """SQLAlchemy declarative base shared by every ORM model in this service."""
    pass


class UserRole(str, enum.Enum):
    """Account roles. Stored as the lowercase enum value in the DB."""
    admin = "admin"
    user = "user"


class User(Base):
    """An account in the SSO directory.

    ``email`` is the login identifier (unique-indexed). ``password_hash`` is
    a bcrypt hash. ``is_active`` is the soft-delete flag — deactivated users
    can no longer authenticate but rows are preserved for audit.
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.user, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    app_access: Mapped[list["AppAccess"]] = relationship(
        back_populates="user", foreign_keys="AppAccess.user_id"
    )


class AppAccess(Base):
    """Per-user, per-app authorization grant.

    Each row is a unique ``(user_id, app_slug)`` pair. ``has_access`` lets
    admins disable access without losing the audit trail of who granted it
    via ``granted_by`` / ``granted_at``.
    """

    __tablename__ = "app_access"
    __table_args__ = (UniqueConstraint("user_id", "app_slug", name="uq_user_app"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    app_slug: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    has_access: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    granted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    user: Mapped["User"] = relationship(back_populates="app_access", foreign_keys=[user_id])


class Setting(Base):
    """Global runtime configuration stored as ``key→value`` strings.

    Used for toggles like ``signup_enabled`` that admins should be able to
    flip without redeploying. ``updated_by`` records the admin that made
    the most recent change.
    """

    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(String(500), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
