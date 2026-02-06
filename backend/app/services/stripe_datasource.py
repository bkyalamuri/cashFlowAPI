"""Load payments from stripe-mock and map to our Payment model."""
import logging
from datetime import datetime, timezone
from typing import List
from uuid import uuid4

import httpx

from app.config import settings
from app.models.payment import Payment, PaymentStatus

logger = logging.getLogger(__name__)

_STATUS_MAP = {
    "succeeded": PaymentStatus.completed,
    "pending": PaymentStatus.pending,
    "failed": PaymentStatus.failed,
}


def _map_charge(charge: dict) -> Payment:
    """Map a Stripe charge object to our Payment model."""
    status_str = charge.get("status", "succeeded")
    refunded = charge.get("refunded", False)

    if refunded:
        pay_status = PaymentStatus.refunded
    else:
        pay_status = _STATUS_MAP.get(status_str, PaymentStatus.completed)

    # Stripe amounts are in cents already
    amount = charge.get("amount", 0)
    # Charges are inbound (money coming in from customer)
    direction = "inbound"

    created_ts = charge.get("created", 0)
    created_at = datetime.fromtimestamp(created_ts, tz=timezone.utc) if created_ts else datetime.now(timezone.utc)

    return Payment(
        id=uuid4(),
        amount_cents=amount,
        currency=(charge.get("currency") or "usd").upper(),
        direction=direction,
        counterparty=charge.get("billing_details", {}).get("name") or charge.get("customer") or "Customer",
        description=charge.get("description") or f"Charge {charge.get('id', '')}",
        status=pay_status,
        created_at=created_at,
        updated_at=None,
        external_id=charge.get("id"),
    )


def _map_balance_transaction(bt: dict) -> Payment:
    """Map a Stripe balance_transaction to our Payment model."""
    bt_type = bt.get("type", "charge")
    amount = bt.get("amount", 0)

    # Determine direction based on type and sign
    if bt_type in ("charge", "payment", "transfer", "payout_reversal"):
        direction = "inbound"
    elif bt_type in ("payout", "refund", "adjustment", "stripe_fee"):
        direction = "outbound"
    else:
        direction = "inbound" if amount >= 0 else "outbound"

    status = PaymentStatus.completed if bt.get("status") == "available" else PaymentStatus.pending

    created_ts = bt.get("created", 0)
    created_at = datetime.fromtimestamp(created_ts, tz=timezone.utc) if created_ts else datetime.now(timezone.utc)

    return Payment(
        id=uuid4(),
        amount_cents=abs(amount),
        currency=(bt.get("currency") or "usd").upper(),
        direction=direction,
        counterparty=bt_type.replace("_", " ").title(),
        description=bt.get("description") or f"{bt_type} transaction",
        status=status,
        created_at=created_at,
        updated_at=None,
        external_id=bt.get("id"),
    )


def load_payments_from_stripe_mock() -> List[Payment]:
    """Fetch charges and balance transactions from stripe-mock and map to Payment objects."""
    base = settings.stripe_mock_url
    headers = {"Authorization": "Bearer sk_test_mock"}
    payments: List[Payment] = []

    try:
        # Fetch charges
        resp = httpx.get(f"{base}/v1/charges", headers=headers, timeout=5.0)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            for charge in data:
                payments.append(_map_charge(charge))

        # Fetch balance transactions
        resp = httpx.get(f"{base}/v1/balance_transactions", headers=headers, timeout=5.0)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            for bt in data:
                payments.append(_map_balance_transaction(bt))

    except httpx.ConnectError:
        logger.warning("Could not connect to stripe-mock at %s. Is it running?", base)
        return []
    except Exception:
        logger.exception("Error fetching from stripe-mock")
        return []

    payments.sort(key=lambda p: p.created_at, reverse=True)
    return payments
