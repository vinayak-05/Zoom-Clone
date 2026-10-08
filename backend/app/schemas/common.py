"""Common schemas for API responses and error reporting."""

from typing import Any
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    detail: str
    code: str


class SuccessResponse(BaseModel):
    message: str
    data: dict[str, Any] | None = None
