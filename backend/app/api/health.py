"""Health check and app settings endpoints."""
from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "service": "cash-flow-copilot"}


@router.get("/api/v1/settings")
def app_settings():
    """Return public, read-only application settings (no secrets)."""
    return {
        "app_name": "Cash Flow Copilot",
        "version": "0.1.0",
        "description": "AI-powered cash flow visibility and Q&A for payments systems",
        "datasource": settings.datasource,
        "stripe_mock_url": settings.stripe_mock_url if settings.datasource in ("stripe", "stripe_seed") else None,
        "copilot_configured": settings.copilot_available,
        "copilot_model": settings.openai_model if settings.copilot_available else None,
        "api_docs_url": "/docs",
    }
