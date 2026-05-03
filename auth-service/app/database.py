from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a single async DB session per request.

    The session is closed automatically when the request finishes (via the
    async context manager), so handlers don't need to manage cleanup.
    ``expire_on_commit=False`` keeps ORM attributes accessible after commit
    so handlers can still read fields off returned objects.
    """
    async with async_session() as session:
        yield session
