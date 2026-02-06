"""In-memory payment store. Loads from data/sample_payments.json when present, else fallback seed."""
import random
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import uuid4

from app.models.payment import Payment, PaymentStatus
from app.services.datasource import load_payments_from_datasource

_SAMPLE_PAYMENTS: List[Payment] = []

# ── Data-generation pools (used by regenerate) ──
_COUNTERPARTIES_INBOUND = [
    "Stripe Payout", "Acme Corp", "Beta LLC", "Startup XYZ",
    "GlobalTech Inc", "Refund Reversal", "Partner Revenue",
    "Marketplace Settlement", "Subscription Revenue", "Invoice Payment",
]
_COUNTERPARTIES_OUTBOUND = [
    "AWS", "Google Cloud", "Payroll", "Vendor A", "Vendor B",
    "Tax Reserve", "Stripe Fees", "Domain Registrar", "SaaS Tools",
    "Marketing Spend", "Office Supplies", "Insurance",
]
_DESCRIPTIONS_INBOUND = [
    "Weekly payout", "Invoice payment", "Subscription revenue",
    "Partner settlement", "Marketplace earnings", "Customer payment",
    "Chargeback reversal", "Wire transfer received",
]
_DESCRIPTIONS_OUTBOUND = [
    "Infrastructure costs", "Monthly SaaS subscription", "Contractor payment",
    "Platform fees", "Quarterly estimated tax", "Annual renewal",
    "Processing fees", "Marketing campaign", "Office rent", "Insurance premium",
]
_STATUSES = [
    PaymentStatus.completed, PaymentStatus.completed,
    PaymentStatus.completed, PaymentStatus.completed,
    PaymentStatus.pending, PaymentStatus.failed,
]


def _seed() -> None:
    global _SAMPLE_PAYMENTS
    if _SAMPLE_PAYMENTS:
        return
    _SAMPLE_PAYMENTS = load_payments_from_datasource()
    if _SAMPLE_PAYMENTS:
        return
    # Fallback: minimal hardcoded sample
    base = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    for i, (amt, direction, counterparty) in enumerate([
        (100_00, "inbound", "Acme Corp"),
        (-45_00, "outbound", "Vendor A"),
        (200_00, "inbound", "Stripe payout"),
        (-120_00, "outbound", "Vendor B"),
        (50_00, "inbound", "Refund reversal"),
        (-30_00, "outbound", "Fee"),
    ]):
        _SAMPLE_PAYMENTS.append(
            Payment(
                id=uuid4(),
                amount_cents=amt,
                currency="USD",
                direction=direction,
                counterparty=counterparty,
                description=f"Sample payment {i + 1}",
                status=PaymentStatus.completed,
                created_at=base.replace(day=1 + (i % 28)),
                updated_at=None,
                external_id=f"ext_{i}",
            )
        )
    _SAMPLE_PAYMENTS.sort(key=lambda p: p.created_at, reverse=True)


def regenerate_payments(count: int = 28) -> List[Payment]:
    """Replace the in-memory store with freshly randomised test payments."""
    global _SAMPLE_PAYMENTS
    now = datetime.now(timezone.utc)
    payments: List[Payment] = []

    for i in range(count):
        days_ago = random.randint(0, 59)
        hour = random.randint(6, 22)
        minute = random.randint(0, 59)
        created = (now - timedelta(days=days_ago)).replace(
            hour=hour, minute=minute, second=0, microsecond=0,
        )

        is_inbound = random.random() < 0.6
        direction = "inbound" if is_inbound else "outbound"

        if is_inbound:
            amount_cents = random.choice([
                random.randint(5_000, 50_000),
                random.randint(50_000, 250_000),
                random.randint(250_000, 500_000),
            ])
            counterparty = random.choice(_COUNTERPARTIES_INBOUND)
            description = random.choice(_DESCRIPTIONS_INBOUND)
        else:
            amount_cents = random.choice([
                random.randint(1_000, 15_000),
                random.randint(15_000, 80_000),
                random.randint(80_000, 250_000),
            ])
            counterparty = random.choice(_COUNTERPARTIES_OUTBOUND)
            description = random.choice(_DESCRIPTIONS_OUTBOUND)

        status = random.choice(_STATUSES)

        payments.append(
            Payment(
                id=uuid4(),
                amount_cents=amount_cents,
                currency="USD",
                direction=direction,
                counterparty=counterparty,
                description=f"{description} — {created.strftime('%b %d')}",
                status=status,
                created_at=created,
                updated_at=None,
                external_id=f"gen_{direction[:2]}_{i:04d}",
            )
        )

    payments.sort(key=lambda p: p.created_at, reverse=True)
    _SAMPLE_PAYMENTS = payments
    return payments


def get_payment_store():
    _seed()
    return _PaymentStore()


class _PaymentStore:
    def list(
        self,
        limit: int = 50,
        direction: Optional[str] = None,
        status: Optional[PaymentStatus] = None,
    ) -> List[Payment]:
        out = list(_SAMPLE_PAYMENTS)
        if direction:
            out = [p for p in out if p.direction == direction]
        if status is not None:
            out = [p for p in out if p.status == status]
        return out[:limit]
