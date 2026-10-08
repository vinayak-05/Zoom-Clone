"""AI Assistant API router."""

from typing import Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai_assistant_service import generate_assistant_reply

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


class ChatRequest(BaseModel):
    message: str
    history: Optional[list[dict[str, Any]]] = None


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(payload: ChatRequest) -> ChatResponse:
    """Send a question or command to the Zoom AI Assistant."""
    reply = await generate_assistant_reply(payload.message, payload.history)
    return ChatResponse(reply=reply)
