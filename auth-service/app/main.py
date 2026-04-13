import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from sqlalchemy import select

from app.auth import hash_password
from app.config import settings
from app.database import async_session, engine
from app.models import AppAccess, Base, Setting, User, UserRole
from app.routers import auth, settings as settings_router, users

logger = logging.getLogger("auth-service")

VALID_APP_SLUGS = [
    "slides-generator",
    "ai-badges",
    "cloud-sahab",
    "data-owner",
    "ai-data-landing",
    "ragflow",
]


async def seed_database() -> None:
    """Create default admin, settings, and app access on first startup."""
    async with async_session() as db:
        # Check for existing admin
        result = await db.execute(select(User).where(User.role == UserRole.admin).limit(1))
        admin = result.scalar_one_or_none()

        if admin is None:
            logger.info("No admin found — creating default admin user")
            admin = User(
                email=settings.DEFAULT_ADMIN_EMAIL,
                password_hash=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                full_name="System Administrator",
                role=UserRole.admin,
            )
            db.add(admin)
            await db.flush()

            # Grant admin access to all apps
            for slug in VALID_APP_SLUGS:
                db.add(AppAccess(user_id=admin.id, app_slug=slug, has_access=True))

            logger.info("Default admin created: %s", settings.DEFAULT_ADMIN_EMAIL)

        # Ensure default settings exist
        result = await db.execute(select(Setting).where(Setting.key == "signup_enabled"))
        if result.scalar_one_or_none() is None:
            db.add(Setting(key="signup_enabled", value="true"))
            logger.info("Default settings created")

        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_database()
    logger.info("Auth service started")
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="KPMG Auth Service",
    version="1.0.0",
    docs_url="/auth/api/docs",
    openapi_url="/auth/api/openapi.json",
    lifespan=lifespan,
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(settings_router.router)


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/auth/api/docs")


@app.get("/auth/api/health")
async def health():
    return {"status": "ok"}
