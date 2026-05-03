from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables / .env file.

    The defaults below are placeholders for local development and MUST be
    overridden in production via env vars (especially ``JWT_SECRET`` and
    ``COOKIE_DOMAIN``). Unknown env vars are ignored so deployment configs
    can carry extra keys without breaking startup.
    """

    DATABASE_URL: str = "postgresql+asyncpg://auth_user:auth_password@shared-db:5432/auth_db"
    JWT_SECRET: str = "your-secret-key-here"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    COOKIE_DOMAIN: str = "digital-foundation.uksouth.cloudapp.azure.com"
    COOKIE_NAME: str = "kpmg_auth_token"
    DEFAULT_ADMIN_EMAIL: str = "admin@kpmg.com"
    DEFAULT_ADMIN_PASSWORD: str = "Admin123!"

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """Synchronous flavour of ``DATABASE_URL`` for Alembic migrations.

        Alembic uses a sync driver while the application uses asyncpg, so
        we swap the driver portion of the URL on demand.
        """
        return self.DATABASE_URL.replace("asyncpg", "psycopg2")

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
