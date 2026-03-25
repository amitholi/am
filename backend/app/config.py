from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://legal_user:legal_pass@localhost:5432/legal_db"
    DATABASE_SYNC_URL: str = "postgresql://legal_user:legal_pass@localhost:5432/legal_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "change-me-in-production"
    ADMIN_API_KEY: str = "admin-secret-key"
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:80"
    CACHE_TTL: int = 300  # 5 minutes
    RATE_LIMIT_PER_MINUTE: int = 100

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
