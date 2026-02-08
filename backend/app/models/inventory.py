"""Inventory models for pickleball clothing and equipment."""
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class InventoryItem(BaseModel):
    id: UUID
    name: str = Field(..., description="Product name")
    category: str = Field(..., description="e.g. Shirts, Shorts, Paddles, Equipment")
    sku: Optional[str] = None
    quantity: int = Field(..., ge=0, description="Current stock count")
    low_stock_threshold: int = Field(default=10, ge=0, description="Alert when quantity falls at or below")


class InventoryTransaction(BaseModel):
    """Payload for recording a sale that reduces inventory."""
    item_id: UUID
    quantity: int = Field(..., gt=0, description="Quantity sold")


class InventoryTransactionResponse(BaseModel):
    """Response after recording a sale."""
    item_id: UUID
    item_name: str
    quantity_sold: int
    new_quantity: int
    low_stock_alert: Optional[dict] = None  # { "item_name": str, "quantity": int } when new_quantity <= threshold
