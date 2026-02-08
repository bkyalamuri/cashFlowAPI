"""In-memory inventory store for pickleball clothing and equipment."""
from typing import List, Optional, Tuple
from uuid import UUID, uuid4

from app.models.inventory import InventoryItem

# Seed data: pickleball clothing and equipment
_INVENTORY: List[InventoryItem] = []


def _seed() -> None:
    global _INVENTORY
    if _INVENTORY:
        return
    _INVENTORY.extend([
        InventoryItem(id=uuid4(), name="Performance Shirt - Blue", category="Shirts", sku="PB-SHIRT-BLUE", quantity=25, low_stock_threshold=10),
        InventoryItem(id=uuid4(), name="Performance Shirt - White", category="Shirts", sku="PB-SHIRT-WHT", quantity=18, low_stock_threshold=10),
        InventoryItem(id=uuid4(), name="Performance Shirt - Black", category="Shirts", sku="PB-SHIRT-BLK", quantity=12, low_stock_threshold=10),
        InventoryItem(id=uuid4(), name="Performance Shorts - Navy", category="Shorts", sku="PB-SHORT-NVY", quantity=15, low_stock_threshold=10),
        InventoryItem(id=uuid4(), name="Performance Shorts - White", category="Shorts", sku="PB-SHORT-WHT", quantity=8, low_stock_threshold=10),
        InventoryItem(id=uuid4(), name="Pickleball Skirt - Black", category="Skirts", sku="PB-SKIRT-BLK", quantity=11, low_stock_threshold=10),
        InventoryItem(id=uuid4(), name="Pickleball Skirt - Teal", category="Skirts", sku="PB-SKIRT-TL", quantity=6, low_stock_threshold=10),
        InventoryItem(id=uuid4(), name="Paddle - Graphite Pro", category="Equipment", sku="PB-PAD-GPRO", quantity=14, low_stock_threshold=10),
        InventoryItem(id=uuid4(), name="Paddle - Beginner", category="Equipment", sku="PB-PAD-BEG", quantity=22, low_stock_threshold=10),
        InventoryItem(id=uuid4(), name="Paddle - Tournament", category="Equipment", sku="PB-PAD-TRN", quantity=9, low_stock_threshold=10),
        InventoryItem(id=uuid4(), name="Hat - Pickleball Logo", category="Accessories", sku="PB-HAT-LOGO", quantity=30, low_stock_threshold=10),
        InventoryItem(id=uuid4(), name="Visor - Performance", category="Accessories", sku="PB-VISOR-PERF", quantity=19, low_stock_threshold=10),
        InventoryItem(id=uuid4(), name="Dress - Athletic", category="Dresses", sku="PB-DRESS-ATH", quantity=7, low_stock_threshold=10),
    ])


def get_inventory_store() -> "_InventoryStore":
    _seed()
    return _InventoryStore()


def _get_items() -> List[InventoryItem]:
    _seed()
    return _INVENTORY


class _InventoryStore:
    def list(self, category: Optional[str] = None) -> List[InventoryItem]:
        items = list(_get_items())
        if category:
            items = [i for i in items if i.category.lower() == category.lower()]
        return items

    def get(self, item_id: UUID) -> Optional[InventoryItem]:
        for item in _get_items():
            if item.id == item_id:
                return item
        return None

    def record_sale(self, item_id: UUID, quantity_sold: int) -> Tuple[InventoryItem, Optional[dict]]:
        """Reduce inventory and return (updated_item, low_stock_alert or None)."""
        items = _get_items()
        for i, item in enumerate(items):
            if item.id == item_id:
                new_qty = max(0, item.quantity - quantity_sold)
                updated = InventoryItem(
                    id=item.id,
                    name=item.name,
                    category=item.category,
                    sku=item.sku,
                    quantity=new_qty,
                    low_stock_threshold=item.low_stock_threshold,
                )
                items[i] = updated
                alert = None
                if new_qty <= item.low_stock_threshold:
                    alert = {"item_name": item.name, "quantity": new_qty}
                return updated, alert
        raise ValueError(f"Item {item_id} not found")
