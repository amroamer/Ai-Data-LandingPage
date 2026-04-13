import uuid

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_token, decode_token, hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Setting, User
from app.schemas import LoginRequest, ResetPasswordRequest, SignupRequest, UserOut

router = APIRouter(prefix="/auth/api", tags=["auth"])

VALID_APP_SLUGS = {
    "slides-generator",
    "ai-badges",
    "cloud-sahab",
    "data-owner",
    "ai-data-landing",
    "ragflow",
}


def _set_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
        domain=settings.COOKIE_DOMAIN,
        max_age=settings.JWT_EXPIRY_HOURS * 3600,
    )


@router.post("/login", response_model=UserOut)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    token = create_token(str(user.id), user.email, user.role.value)
    _set_cookie(response, token)
    return user


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, response: Response, db: AsyncSession = Depends(get_db)):
    # Check if signup is enabled
    result = await db.execute(select(Setting).where(Setting.key == "signup_enabled"))
    setting = result.scalar_one_or_none()
    if setting and setting.value.lower() != "true":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Signup is currently disabled")

    # Check duplicate email
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(str(user.id), user.email, user.role.value)
    _set_cookie(response, token)
    return user


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        domain=settings.COOKIE_DOMAIN,
    )
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user


@router.get("/verify")
async def verify(kpmg_auth_token: str | None = Cookie(None)):
    """Fast JWT-only verification for Nginx auth_request. No database call."""
    if not kpmg_auth_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    payload = decode_token(kpmg_auth_token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return Response(status_code=200)


@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.old_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    user.password_hash = hash_password(body.new_password)
    await db.commit()
    return {"detail": "Password updated"}


@router.get("/check-access/{app_slug}")
async def check_access(
    app_slug: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if app_slug not in VALID_APP_SLUGS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid app slug")

    from app.models import AppAccess

    result = await db.execute(
        select(AppAccess).where(AppAccess.user_id == user.id, AppAccess.app_slug == app_slug)
    )
    access = result.scalar_one_or_none()
    has_access = access is not None and access.has_access
    return {"app_slug": app_slug, "has_access": has_access}
