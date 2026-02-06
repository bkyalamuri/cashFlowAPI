#!/usr/bin/env python3
"""Generate realistic test payment data using stripe-mock fixture shapes.

Fetches fixture shapes from a running stripe-mock instance, then generates
25-30 varied payments with randomized amounts, recent dates, counterparties,
and mixed statuses.  Writes to backend/data/stripe_payments.json.

Usage:
    # Start stripe-mock first:
    docker run -d -p 12111:12111 stripe/stripe-mock:latest

    # Then run this script:
    python -m scripts.seed_stripe_data
"""
import json
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    import httpx
except ImportError:
    print("httpx is required. Install with: pip install httpx")
    sys.exit(1)

STRIPE_MOCK_URL = "http://localhost:12111"
OUTPUT_FILE = Path(__file__).resolve().parent.parent / "data" / "stripe_payments.json"

COUNTERPARTIES_INBOUND = [
    "Stripe Payout", "Acme Corp", "Beta LLC", "Startup XYZ",
    "GlobalTech Inc", "Refund Reversal", "Partner Revenue",
    "Marketplace Settlement", "Subscription Revenue", "Invoice Payment",
]

COUNTERPARTIES_OUTBOUND = [
    "AWS", "Google Cloud", "Payroll", "Vendor A", "Vendor B",
    "Tax Reserve", "Stripe Fees", "Domain Registrar", "SaaS Tools",
    "Marketing Spend", "Office Supplies", "Insurance",
]

DESCRIPTIONS_INBOUND = [
    "Weekly payout", "Invoice payment", "Subscription revenue",
    "Partner settlement", "Marketplace earnings", "Customer payment",
    "Chargeback reversal", "Wire transfer received",
]

DESCRIPTIONS_OUTBOUND = [
    "Infrastructure costs", "Monthly SaaS subscription", "Contractor payment",
    "Platform fees", "Quarterly estimated tax", "Annual renewal",
    "Processing fees", "Marketing campaign", "Office rent", "Insurance premium",
]

STATUSES = ["completed", "completed", "completed", "completed", "pending", "failed"]


def fetch_stripe_fixture_shape():
    """Fetch a charge fixture from stripe-mock to verify it's running."""
    headers = {"Authorization": "Bearer sk_test_mock"}
    try:
        resp = httpx.get(f"{STRIPE_MOCK_URL}/v1/charges", headers=headers, timeout=5.0)
        if resp.status_code == 200:
            return resp.json().get("data", [])
    except httpx.ConnectError:
        return None
    return None


def generate_payments(count: int = 28) -> list:
    """Generate varied test payments with recent dates."""
    payments = []
    now = datetime.now(timezone.utc)

    for i in range(count):
        # Random date within last 60 days
        days_ago = random.randint(0, 59)
        hour = random.randint(6, 22)
        minute = random.randint(0, 59)
        created = (now - timedelta(days=days_ago)).replace(hour=hour, minute=minute, second=0, microsecond=0)

        # ~60% inbound, ~40% outbound
        is_inbound = random.random() < 0.6
        direction = "inbound" if is_inbound else "outbound"

        if is_inbound:
            # Inbound: $50 - $5,000
            amount_cents = random.choice([
                random.randint(5000, 50000),    # small payments
                random.randint(50000, 250000),   # medium payments
                random.randint(250000, 500000),  # large payments
            ])
            counterparty = random.choice(COUNTERPARTIES_INBOUND)
            description = random.choice(DESCRIPTIONS_INBOUND)
        else:
            # Outbound: $10 - $2,500
            amount_cents = random.choice([
                random.randint(1000, 15000),     # small expenses
                random.randint(15000, 80000),    # medium expenses
                random.randint(80000, 250000),   # large expenses
            ])
            counterparty = random.choice(COUNTERPARTIES_OUTBOUND)
            description = random.choice(DESCRIPTIONS_OUTBOUND)

        status = random.choice(STATUSES)

        payments.append({
            "amount_cents": amount_cents,
            "currency": "USD",
            "direction": direction,
            "counterparty": counterparty,
            "description": f"{description} — {created.strftime('%b %d')}",
            "status": status,
            "created_at": created.isoformat(),
            "external_id": f"stripe_{direction[:2]}_{i:04d}",
        })

    # Sort by date descending
    payments.sort(key=lambda p: p["created_at"], reverse=True)
    return payments


def main():
    # Check stripe-mock connectivity (optional, just for validation)
    fixtures = fetch_stripe_fixture_shape()
    if fixtures is not None:
        print(f"stripe-mock is running. Got {len(fixtures)} fixture charge(s).")
    else:
        print("stripe-mock is not reachable (this is OK — generating data independently).")

    payments = generate_payments(28)

    # Ensure output directory exists
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(payments, indent=2))

    total_in = sum(p["amount_cents"] for p in payments if p["direction"] == "inbound") / 100
    total_out = sum(p["amount_cents"] for p in payments if p["direction"] == "outbound") / 100
    print(f"Generated {len(payments)} payments -> {OUTPUT_FILE}")
    print(f"  Inflows:  ${total_in:,.2f}")
    print(f"  Outflows: ${total_out:,.2f}")
    print(f"  Net:      ${total_in - total_out:,.2f}")


if __name__ == "__main__":
    main()
