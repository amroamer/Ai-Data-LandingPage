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

# Apps allowed to participate in this SSO universe. Used by ``check-access``
# to reject typos before doing the DB lookup. Must stay in sync with the
# same constant in ``main.py``.
VALID_APP_SLUGS = {
    "slides-generator",
    "ai-badges",
    "cloud-sahab",
    "data-owner",
    "ai-data-landing",
    "ragflow",
}


def _set_cookie(response: Response, token: str) -> None:
    """Write the SSO cookie carrying the JWT.

    Attributes are intentionally hard-coded here (HttpOnly, Secure, SameSite=lax)
    so they cannot be weakened by configuration drift. Domain and name come
    from settings; ``max_age`` is kept in sync with the JWT expiration so
    the cookie disappears at exactly the same time the token becomes invalid.
    """
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
    """Authenticate via email + password.

    On success, mints a JWT, sets the SSO cookie on the response, and returns
    the user object. Returns 401 for an unknown email or wrong password and
    403 for a deactivated account.
    """
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
    """Self-service account creation, gated by the global ``signup_enabled`` flag.

    Returns 403 if signup is disabled, 409 if the email already exists. On
    success, the user is created, an SSO cookie is set, and the new user
    object is returned. The new account starts with no app-access grants —
    an admin must enable apps individually.
    """
    result = await db.execute(select(Setting).where(Setting.key == "signup_enabled"))
    setting = result.scalar_one_or_none()
    if setting and setting.value.lower() != "true":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Signup is currently disabled")

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
    """Clear the SSO cookie on the client side.

    Note: this does NOT invalidate the JWT itself (there's no server-side
    revocation list), so a token captured before logout remains valid until
    its ``exp``. For full revocation, deactivate the user and wait for the
    JWT to expire.
    """
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        domain=settings.COOKIE_DOMAIN,
    )
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    """Return the user identified by the current cookie. Used by the SPA on boot."""
    return user


@router.get("/verify")
async def verify(kpmg_auth_token: str | None = Cookie(None)):
    """Fast JWT-only verification for Nginx ``auth_request``. No database call.

    Intentionally cheap — no DB hit and no role/active-status check. If a
    user is deactivated server-side, they remain authorized via this endpoint
    until their token expires. Endpoints that need active-status enforcement
    must use ``get_current_user`` instead.
    """
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
    """Self-service password change. Requires the current password as proof of identity."""
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
    """Return whether the current user is permitted to use a given app.

    The slug must be one of ``VALID_APP_SLUGS``; unknown slugs return 400
    rather than silently false. Apps call this from their backends (or via
    the Nginx auth subrequest pattern) to gate their entrypoints.
    """
    if app_slug not in VALID_APP_SLUGS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid app slug")

    from app.models import AppAccess

    result = await db.execute(
        select(AppAccess).where(AppAccess.user_id == user.id, AppAccess.app_slug == app_slug)
    )
    access = result.scalar_one_or_none()
    has_access = access is not None and access.has_access
    return {"app_slug": app_slug, "has_access": has_access}
