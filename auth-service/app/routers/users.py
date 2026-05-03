import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import hash_password
from app.database import get_db
from app.dependencies import require_admin
from app.models import AppAccess, User
from app.schemas import (
    AdminResetPasswordRequest,
    CreateUserRequest,
    UpdateAccessRequest,
    UpdateUserRequest,
    UserWithAccessOut,
)

router = APIRouter(prefix="/auth/api/users", tags=["users"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[UserWithAccessOut])
async def list_users(db: AsyncSession = Depends(get_db)):
    """List every user with their full app-access set, oldest-first. Admin only.

    Uses ``selectinload`` to fetch the access rows in a second query rather
    than producing N+1 queries during serialization.
    """
    result = await db.execute(select(User).options(selectinload(User.app_access)).order_by(User.created_at))
    return result.scalars().all()


@router.post("", response_model=UserWithAccessOut, status_code=status.HTTP_201_CREATED)
async def create_user(body: CreateUserRequest, db: AsyncSession = Depends(get_db)):
    """Admin-create a new user.

    Returns 409 if the email is already registered. New users start with no
    app-access — call ``PUT /users/{id}/access`` to grant entitlements.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
    )
    db.add(user)
    await db.commit()

    result = await db.execute(
        select(User).where(User.id == user.id).options(selectinload(User.app_access))
    )
    return result.scalar_one()


@router.get("/{user_id}", response_model=UserWithAccessOut)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Read a single user (with app-access). 404 when not found."""
    result = await db.execute(
        select(User).where(User.id == user_id).options(selectinload(User.app_access))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserWithAccessOut)
async def update_user(user_id: uuid.UUID, body: UpdateUserRequest, db: AsyncSession = Depends(get_db)):
    """Partial update: only fields explicitly set on the body are touched.

    Admins can change name, role, and active flag here. Email and password
    have their own dedicated endpoints.
    """
    result = await db.execute(
        select(User).where(User.id == user_id).options(selectinload(User.app_access))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.role is not None:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}")
async def delete_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Soft-delete: flip ``is_active`` to False rather than removing the row.

    The user's data, including app-access history, is preserved. They can
    no longer authenticate, but tokens minted before deactivation remain
    valid until expiry (the ``/verify`` endpoint does not check active state).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = False
    await db.commit()
    return {"detail": "User deactivated"}


@router.post("/{user_id}/reset-password")
async def admin_reset_password(
    user_id: uuid.UUID,
    body: AdminResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Admin-override password reset. No old-password proof required."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(body.new_password)
    await db.commit()
    return {"detail": "Password updated"}


@router.put("/{user_id}/access")
async def update_access(
    user_id: uuid.UUID,
    body: UpdateAccessRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Bulk-update per-app access grants for one user.

    Only the slugs listed in ``body.access`` are touched — slugs not in the
    payload are left as-is. Existing rows are updated in place; missing
    rows are created. Each touched row is stamped with the calling admin's
    id in ``granted_by``.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    for entry in body.access:
        result = await db.execute(
            select(AppAccess).where(AppAccess.user_id == user_id, AppAccess.app_slug == entry.app_slug)
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.has_access = entry.has_access
            existing.granted_by = admin.id
        else:
            db.add(
                AppAccess(
                    user_id=user_id,
                    app_slug=entry.app_slug,
                    has_access=entry.has_access,
                    granted_by=admin.id,
                )
            )

    await db.commit()
    return {"detail": "Access updated"}
