"""Cash flow summary and period models."""
from datetime import date
from typing import List

from pydantic import BaseModel, Field


class CashFlowPeriod(BaseModel):
    """A time bucket (e.g. day or week) with inflows and outflows."""
    period_start: date
    period_end: date
    inflow_cents: int = 0
    outflow_cents: int = 0
    net_cents: int = 0
    transaction_count: int = 0


class CashFlowSummary(BaseModel):
    """Summary over a date range."""
    start_date: date
    end_date: date
    total_inflow_cents: int = 0
    total_outflow_cents: int = 0
    net_cents: int = 0
    periods: List[CashFlowPeriod] = Field(default_factory=list)
