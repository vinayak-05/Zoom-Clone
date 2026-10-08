from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_DEFAULT_DB_PATH = (_BACKEND_DIR / "zoom.db").as_posix()


class Settings(BaseSettings):
    """Central configuration pulled from .env or environment."""

    DATABASE_URL: str = f"sqlite:///{_DEFAULT_DB_PATH}"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    ZOOM_AI_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
