from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://auth_user:auth_password@shared-db:5432/auth_db"
    JWT_SECRET: str = "your-secret-key-here"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    COOKIE_DOMAIN: str = "digital-foundation.uaenorth.cloudapp.azure.com"
    COOKIE_NAME: str = "kpmg_auth_token"
    DEFAULT_ADMIN_EMAIL: str = "admin@kpmg.com"
    DEFAULT_ADMIN_PASSWORD: str = "Admin123!"

    # Alembic needs a sync URL for migrations
    @property
    def DATABASE_URL_SYNC(self) -> str:
        return self.DATABASE_URL.replace("asyncpg", "psycopg2")

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
