"""Payment-related models."""
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PaymentStatus(str, Enum):
    completed = "completed"
    pending = "pending"
    failed = "failed"
    refunded = "refunded"


class PaymentBase(BaseModel):
    amount_cents: int = Field(..., description="Amount in smallest currency unit (e.g. cents)")
    currency: str = Field(default="USD", max_length=3)
    direction: str = Field(..., description="inbound | outbound")
    counterparty: Optional[str] = None
    description: Optional[str] = None
    status: PaymentStatus = PaymentStatus.completed


class PaymentCreate(PaymentBase):
    """Payload for creating a payment (e.g. from webhook or import)."""
    external_id: Optional[str] = None


class Payment(PaymentBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    external_id: Optional[str] = None

    model_config = {"from_attributes": True}
