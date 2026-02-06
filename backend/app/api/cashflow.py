"""Cash flow summary endpoints."""
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Query

from app.models.cashflow import CashFlowSummary
from app.services.cashflow_service import get_cashflow_summary

router = APIRouter()


@router.get("/cashflow/summary", response_model=CashFlowSummary)
def cashflow_summary(
    start_date: Optional[date] = Query(default=None, description="Start of range"),
    end_date: Optional[date] = Query(default=None, description="End of range"),
):
    end = end_date or date.today()
    start = start_date or (end - timedelta(days=90))
    return get_cashflow_summary(start=start, end=end)
