"""FastAPI application factory with CORS, router registration, and startup hooks."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.db.seed import run_seed


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Create tables and seed data on startup."""
    # Import all models so Base.metadata knows about them
    import app.models.user  # noqa: F401
    import app.models.meeting  # noqa: F401
    import app.models.participant  # noqa: F401
    import app.models.chat_message  # noqa: F401

    Base.metadata.create_all(bind=engine)
    run_seed()
    yield


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    application = FastAPI(
        title="Zoom Clone API",
        version="1.0.0",
        description="Backend API for a Zoom web-app clone",
        lifespan=lifespan,
    )

    # CORS – allow the frontend origin
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health-check route
    @application.get("/health", tags=["Health"])
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    # Register API routers (added in later phases)
    # from app.api.v1 import meetings, participants, users, ws
    # application.include_router(meetings.router, prefix="/api/v1")
    # ...

    return application


app = create_app()
