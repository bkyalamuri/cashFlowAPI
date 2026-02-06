"""Copilot Q&A endpoint."""
import logging

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models.copilot import CopilotAskRequest, CopilotAskResponse
from app.services.copilot_service import ask_copilot, CopilotError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/status")
def status():
    """Check whether the copilot integration is configured."""
    if settings.copilot_available:
        return {"configured": True}
    return {
        "configured": False,
        "message": "Set OPENAI_API_KEY in backend/.env to enable the copilot.",
    }


@router.post("/ask", response_model=CopilotAskResponse)
def ask(request: CopilotAskRequest):
    if not settings.copilot_available:
        raise HTTPException(
            status_code=503,
            detail="Copilot is not configured. Set OPENAI_API_KEY in .env.",
        )
    try:
        return ask_copilot(question=request.question, context=request.context or {})
    except CopilotError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception:
        logger.exception("Unhandled error in copilot ask endpoint")
        raise HTTPException(status_code=502, detail="Copilot request failed unexpectedly.")
