"""FastAPI application factory with CORS, router registration, and startup hooks."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.db.seed import run_seed
from app.api.v1 import users, meetings, participants, ws, settings_api, auth, assistant


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Create tables and seed data on startup."""
    from app.models import (  # noqa: F401
        user as _user,
        meeting as _meeting,
        participant as _participant,
        chat_message as _chat_message,
        setting as _setting,
    )

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

    # CORS – allow frontend origin
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health-check route
    @application.get("/health", tags=["Health"])
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    # Register API v1 Routers
    application.include_router(auth.router, prefix="/api/v1")
    application.include_router(users.router, prefix="/api/v1")
    application.include_router(meetings.router, prefix="/api/v1")
    application.include_router(participants.router, prefix="/api/v1")
    application.include_router(settings_api.router, prefix="/api/v1")
    application.include_router(assistant.router, prefix="/api/v1")
    application.include_router(ws.router)

    return application


app = create_app()
