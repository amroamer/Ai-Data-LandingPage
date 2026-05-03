import uuid

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import decode_token
from app.config import settings
from app.database import get_db
from app.models import User


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    kpmg_auth_token: str | None = Cookie(None),
) -> User:
    """Resolve the requesting user from the auth cookie.

    Looks up the SSO cookie (FastAPI matches the parameter name to the
    cookie name, so this MUST stay in sync with ``settings.COOKIE_NAME``),
    decodes the JWT, and loads the corresponding active user from the
    database.

    Raises 401 for any failure — missing cookie, invalid/expired token,
    malformed ``sub`` claim, or a user that is missing or deactivated. The
    handler is intentionally non-revealing about which step failed so we
    don't leak account-existence information.
    """
    if not kpmg_auth_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_token(kpmg_auth_token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    try:
        uid = uuid.UUID(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.id == uid, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Layer on ``get_current_user`` to additionally require the admin role.

    Raises 403 (not 401) for authenticated non-admins so clients can
    distinguish "log in" from "you don't have permission".
    """
    if user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
