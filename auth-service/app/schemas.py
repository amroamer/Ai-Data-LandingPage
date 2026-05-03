import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


# ── Auth ──

class LoginRequest(BaseModel):
    """Inbound shape for ``POST /auth/api/login``."""
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    """Inbound shape for ``POST /auth/api/signup`` with password rules."""
    email: EmailStr
    password: str
    full_name: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Enforce: ≥8 chars, at least one letter, at least one digit.

        Mirrors the client-side rules in `SignupPage.jsx` so failures are
        consistent on both sides.
        """
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class ResetPasswordRequest(BaseModel):
    """Inbound shape for the self-service password change endpoint."""
    old_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Same rules as ``SignupRequest.validate_password``."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class AdminResetPasswordRequest(BaseModel):
    """Inbound shape for the admin-override password reset.

    No old password required — admin authority is implied by the route guard.
    """
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Same complexity rules as user-driven password changes."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


# ── User responses ──

class AppAccessOut(BaseModel):
    """Per-app access row returned alongside a user."""
    app_slug: str
    has_access: bool
    granted_at: datetime

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    """Public-facing user shape (no password hash, no app access)."""
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserWithAccessOut(UserOut):
    """``UserOut`` plus the list of app-access grants — used by admin endpoints."""
    app_access: list[AppAccessOut] = []


# ── User management (admin) ──

class CreateUserRequest(BaseModel):
    """Admin-create-user payload. Email + password + role + name."""
    email: EmailStr
    password: str
    full_name: str
    role: str = "user"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Same complexity rules as user-driven password creation."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Reject anything other than the two known roles."""
        if v not in ("admin", "user"):
            raise ValueError("Role must be 'admin' or 'user'")
        return v


class UpdateUserRequest(BaseModel):
    """Admin-edit-user payload. All fields optional — partial update."""
    full_name: str | None = None
    role: str | None = None
    is_active: bool | None = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str | None) -> str | None:
        """Allow ``None`` (unchanged); otherwise restrict to the two known roles."""
        if v is not None and v not in ("admin", "user"):
            raise ValueError("Role must be 'admin' or 'user'")
        return v


class AppAccessUpdate(BaseModel):
    """Single access entry inside an ``UpdateAccessRequest``."""
    app_slug: str
    has_access: bool


class UpdateAccessRequest(BaseModel):
    """Bulk update of a user's per-app access. Only listed slugs are touched."""
    access: list[AppAccessUpdate]


# ── Settings ──

class SettingOut(BaseModel):
    """Outbound shape for one global setting row."""
    key: str
    value: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class UpdateSettingsRequest(BaseModel):
    """Bulk-update payload for global settings: ``{ key: value }``."""
    settings: dict[str, str]
