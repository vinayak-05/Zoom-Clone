"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration pulled from .env or environment."""

    DATABASE_URL: str = "sqlite:///./zoom.db"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    ZOOM_AI_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
