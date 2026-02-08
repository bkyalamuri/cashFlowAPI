"""Inventory endpoints for pickleball clothing and equipment."""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.models.inventory import InventoryItem, InventoryTransaction, InventoryTransactionResponse
from app.services.inventory_store import get_inventory_store

router = APIRouter()


@router.get("/inventory", response_model=List[InventoryItem])
def list_inventory(
    category: Optional[str] = Query(default=None, description="Filter by category"),
):
    """List all inventory items (pickleball clothing and equipment)."""
    store = get_inventory_store()
    return store.list(category=category)


@router.post("/inventory/transaction", response_model=InventoryTransactionResponse)
def record_transaction(tx: InventoryTransaction):
    """Record a sale (transaction) that reduces inventory. Returns low_stock_alert if quantity falls at or below threshold."""
    store = get_inventory_store()
    try:
        updated, alert = store.record_sale(tx.item_id, tx.quantity)
        return InventoryTransactionResponse(
            item_id=updated.id,
            item_name=updated.name,
            quantity_sold=tx.quantity,
            new_quantity=updated.quantity,
            low_stock_alert=alert,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
