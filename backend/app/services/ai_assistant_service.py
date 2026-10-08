"""Zoom AI Assistant service powered by Google Generative AI."""

import logging
from typing import Any
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Zoom Virtual Assistant and AI Companion for Zoom Web App Clone.
You assist Vinayak and participants with:
- Managing and scheduling Zoom meetings
- Account settings (Clips with avatars, Canvas AI revision, Paper, Sheets with AI Formula & Function, Slides, Waiting Room, Video/Audio defaults)
- Real-time meeting troubleshooting (camera, microphone, screen sharing)
- Providing meeting summaries, action items, and advice
Always be professional, polite, concise, and helpful like the official Zoom AI Companion."""


async def generate_assistant_reply(message: str, history: list[dict[str, Any]] | None = None) -> str:
    """Call Google Generative AI API using the configured key with fallback models."""
    key = settings.ZOOM_AI_KEY
    if not key:
        return "Zoom AI Assistant key is not configured."

    # Build contents with optional chat history
    contents: list[dict[str, Any]] = []

    if history:
        for item in history[-6:]:  # Keep recent history
            role = "user" if item.get("sender") == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": item.get("text", "")}],
            })

    # Add system prompt and current message
    current_prompt = f"{SYSTEM_PROMPT}\n\nUser Question: {message}"
    contents.append({
        "role": "user",
        "parts": [{"text": current_prompt}],
    })

    candidate_models = [
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
    ]

    async with httpx.AsyncClient(timeout=25.0) as client:
        for model in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            try:
                response = await client.post(url, json={"contents": contents})
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
                elif response.status_code in (404, 503):
                    # Try next model if model not found or temporary 503
                    logger.warning(f"Model {model} returned {response.status_code}, trying next...")
                    continue
                else:
                    logger.error(f"Gemini API error {response.status_code}: {response.text}")
            except Exception as e:
                logger.warning(f"Error querying {model}: {e}")
                continue

    # Graceful fallback if cloud API is unreachable
    msg_lower = message.lower()
    if "setting" in msg_lower or "clip" in msg_lower or "canvas" in msg_lower or "avatar" in msg_lower:
        return (
            "You can manage your Clips (custom avatars), Canvas AI generation, Sheets AI formulas, "
            "and Meeting video/audio preferences directly in the Settings tab. All changes are saved automatically to the cloud."
        )
    if "camera" in msg_lower or "mic" in msg_lower or "video" in msg_lower or "audio" in msg_lower:
        return (
            "To manage audio and video, use the Meeting controls in Settings or toggle mic/camera before joining. "
            "Our system now halts device tracks when turned off to preserve battery and privacy."
        )
    if "schedule" in msg_lower or "meeting" in msg_lower:
        return (
            "You can schedule a new meeting from the Schedule tab or start an instant meeting with video on or off anytime "
            "using your Personal Meeting ID (382 914 8201)."
        )

    return (
        f"I've received your query about '{message}'. As your Zoom AI Assistant, I can help you configure settings, "
        "manage meetings, and assist with real-time meeting questions."
    )
