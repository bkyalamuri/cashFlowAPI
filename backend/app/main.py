"""FastAPI application entrypoint for the cash flow copilot."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import copilot, health, payments, cashflow, inventory
from app.config import settings

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Cash Flow Copilot API",
    description="AI-powered cash flow visibility and Q&A for payments systems",
    version="0.1.0",
)

logger.info("Copilot configured: %s", settings.copilot_available)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(payments.router, prefix="/api/v1", tags=["payments"])
app.include_router(cashflow.router, prefix="/api/v1", tags=["cashflow"])
app.include_router(copilot.router, prefix="/api/v1/copilot", tags=["copilot"])
app.include_router(inventory.router, prefix="/api/v1", tags=["inventory"])


@app.get("/")
def root():
    return {
        "service": "Cash Flow Copilot API",
        "docs": "/docs",
        "health": "/health",
    }
