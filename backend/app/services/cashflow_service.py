"""Cash flow aggregation from payments."""
from datetime import date
from collections import defaultdict

from app.models.cashflow import CashFlowSummary, CashFlowPeriod
from app.services.payment_store import get_payment_store


def get_cashflow_summary(start: date, end: date) -> CashFlowSummary:
    store = get_payment_store()
    payments = store.list(limit=500)
    by_period: dict[date, tuple[int, int, int]] = defaultdict(lambda: (0, 0, 0))

    total_in = 0
    total_out = 0
    for p in payments:
        created = p.created_at.date()
        if created < start or created > end:
            continue
        inc, out, count = by_period[created]
        if p.direction == "inbound" and p.amount_cents > 0:
            inc += p.amount_cents
            total_in += p.amount_cents
        elif p.direction == "outbound":
            out += abs(p.amount_cents)
            total_out += abs(p.amount_cents)
        count += 1
        by_period[created] = (inc, out, count)

    periods = [
        CashFlowPeriod(
            period_start=d,
            period_end=d,
            inflow_cents=inc,
            outflow_cents=out,
            net_cents=inc - out,
            transaction_count=count,
        )
        for d in sorted(by_period.keys())
        for inc, out, count in [by_period[d]]
    ]

    return CashFlowSummary(
        start_date=start,
        end_date=end,
        total_inflow_cents=total_in,
        total_outflow_cents=total_out,
        net_cents=total_in - total_out,
        periods=periods,
    )
