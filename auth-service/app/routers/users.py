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
    result = await db.execute(select(User).options(selectinload(User.app_access)).order_by(User.created_at))
    return result.scalars().all()


@router.post("", response_model=UserWithAccessOut, status_code=status.HTTP_201_CREATED)
async def create_user(body: CreateUserRequest, db: AsyncSession = Depends(get_db)):
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
    result = await db.execute(
        select(User).where(User.id == user_id).options(selectinload(User.app_access))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserWithAccessOut)
async def update_user(user_id: uuid.UUID, body: UpdateUserRequest, db: AsyncSession = Depends(get_db)):
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
    # Verify user exists
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
