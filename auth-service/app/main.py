import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from sqlalchemy import select

from app.auth import hash_password
from app.config import settings
from app.database import async_session, engine
from app.models import AppAccess, Product, Setting, User, UserRole
from app.routers import auth, products as products_router, settings as settings_router, users
from app.seed_data import DEFAULT_PRODUCTS

logger = logging.getLogger("auth-service")

# Slugs of every app that participates in this SSO universe. The seed code
# below grants the bootstrap admin access to all of them. Must stay in sync
# with the same constant in routers/auth.py.
VALID_APP_SLUGS = [
    "slides-generator",
    "ai-badges",
    "cloud-sahab",
    "data-owner",
    "ai-data-landing",
    "ragflow",
]


async def seed_database() -> None:
    """Create the bootstrap admin, default settings, and seed products on first start.

    Idempotent: safe to run on every startup. Creates an admin only when no
    admin exists yet, only inserts default settings rows that are missing,
    and only seeds products when the table is empty (so admins can freely
    delete entries without them being re-added on restart).
    """
    async with async_session() as db:
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

            for slug in VALID_APP_SLUGS:
                db.add(AppAccess(user_id=admin.id, app_slug=slug, has_access=True))

            logger.info("Default admin created: %s", settings.DEFAULT_ADMIN_EMAIL)

        result = await db.execute(select(Setting).where(Setting.key == "signup_enabled"))
        if result.scalar_one_or_none() is None:
            db.add(Setting(key="signup_enabled", value="true"))
            logger.info("Default settings created")

        # Seed products only if the table is empty — never re-add deleted ones.
        result = await db.execute(select(Product).limit(1))
        if result.scalar_one_or_none() is None:
            for entry in DEFAULT_PRODUCTS:
                db.add(Product(**entry))
            logger.info("Seeded %d default products", len(DEFAULT_PRODUCTS))

        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """ASGI lifespan handler.

    Schema management is owned by Alembic and runs from the container
    entrypoint before this process starts; here we only run the idempotent
    seeder and dispose of the connection pool on shutdown.
    """
    await seed_database()
    logger.info("Auth service started")
    yield
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
app.include_router(products_router.public_router)
app.include_router(products_router.admin_router)


@app.get("/", include_in_schema=False)
async def root():
    """Root convenience redirect: bounces visitors to the Swagger UI."""
    return RedirectResponse(url="/auth/api/docs")


@app.get("/auth/api/health")
async def health():
    """Liveness probe used by orchestrators (Docker, Kubernetes, etc.)."""
    return {"status": "ok"}
