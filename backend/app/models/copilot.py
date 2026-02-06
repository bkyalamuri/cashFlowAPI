"""Copilot chat / Q&A models."""
from typing import List, Optional

from pydantic import BaseModel, Field


class CopilotAskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Natural language question about cash flow")
    context: Optional[dict] = Field(default=None, description="Optional extra context (e.g. date range)")


class CopilotAskResponse(BaseModel):
    answer: str = Field(..., description="Copilot's answer")
    sources_used: List[str] = Field(default_factory=list, description="Data or tools used to answer")
