from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.config import settings


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt with a fresh salt.

    Returns the encoded hash as a UTF-8 string suitable for storing in the
    ``users.password_hash`` column.
    """
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time check that ``plain`` matches the stored ``hashed`` value."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: str, email: str, role: str) -> str:
    """Mint a signed JWT carrying the user's identity and role.

    The token expires after ``settings.JWT_EXPIRY_HOURS`` and is signed with
    ``settings.JWT_SECRET`` using ``settings.JWT_ALGORITHM`` (HS256 by default).
    The cookie ``max_age`` set by the auth router is kept in sync with this
    expiration so the cookie and the token become invalid together.
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRY_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Verify and decode a JWT.

    Returns the decoded payload dict on success, or ``None`` if the token is
    malformed, has an invalid signature, has expired, or is missing the
    required ``sub`` claim. Callers treat ``None`` as "not authenticated"
    rather than distinguishing between failure modes.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("sub") is None:
            return None
        return payload
    except JWTError:
        return None
