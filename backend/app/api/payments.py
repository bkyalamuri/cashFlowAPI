"""Payment list and CRUD (stub with sample data)."""
from typing import List, Optional

from fastapi import APIRouter, Query

from app.models.payment import Payment, PaymentStatus
from app.services.payment_store import get_payment_store, regenerate_payments

router = APIRouter()


@router.get("/payments", response_model=List[Payment])
def list_payments(
    limit: int = Query(default=50, ge=1, le=500),
    direction: Optional[str] = Query(default=None, description="inbound | outbound"),
    status: Optional[PaymentStatus] = None,
):
    store = get_payment_store()
    return store.list(limit=limit, direction=direction, status=status)


@router.post("/payments/regenerate")
def regenerate_data(
    count: int = Query(default=28, ge=5, le=100, description="Number of payments to generate"),
):
    """Replace the in-memory payment store with freshly randomised test data."""
    payments = regenerate_payments(count)
    total_in = sum(p.amount_cents for p in payments if p.direction == "inbound")
    total_out = sum(p.amount_cents for p in payments if p.direction == "outbound")
    return {
        "message": f"Regenerated {len(payments)} test payments",
        "count": len(payments),
        "total_inflow_cents": total_in,
        "total_outflow_cents": total_out,
        "net_cents": total_in - total_out,
    }
