"""Copilot: answer natural language questions using cash flow data and an LLM."""
import logging
from datetime import date

from openai import OpenAI, APIError, APIConnectionError, APITimeoutError

from app.config import settings
from app.models.copilot import CopilotAskResponse
from app.services.cashflow_service import get_cashflow_summary
from app.services.payment_store import get_payment_store

logger = logging.getLogger(__name__)


class CopilotError(Exception):
    """Raised when the LLM call fails for any reason."""

    def __init__(self, message: str, status_code: int = 502):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _build_payments_context() -> str:
    """Build a detailed data context from all payments for the LLM."""
    store = get_payment_store()
    payments = store.list(limit=500)

    if not payments:
        return "No payment data available."

    # Find actual date range of the data
    dates = [p.created_at.date() for p in payments]
    earliest = min(dates)
    latest = max(dates)

    # Get summary over the actual data range
    summary = get_cashflow_summary(start=earliest, end=latest)

    lines = [
        f"Data range: {earliest} to {latest} ({len(payments)} payments)",
        f"Total inflows: ${summary.total_inflow_cents / 100:,.2f}",
        f"Total outflows: ${summary.total_outflow_cents / 100:,.2f}",
        f"Net cash flow: ${summary.net_cents / 100:,.2f}",
        "",
        "Individual payments:",
    ]

    for p in sorted(payments, key=lambda x: x.created_at, reverse=True):
        sign = "+" if p.direction == "inbound" else "-"
        amt = abs(p.amount_cents) / 100
        lines.append(
            f"  {p.created_at.date()} | {sign}${amt:,.2f} | {p.direction} | "
            f"{p.counterparty or 'N/A'} | {p.description or ''} | {p.status}"
        )

    return "\n".join(lines)


def ask_copilot(question: str, context: dict) -> CopilotAskResponse:
    client = OpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        timeout=30.0,
    )

    data_blurb = _build_payments_context()

    system = """You are a helpful cash flow copilot for a payments system.
Answer concisely using the provided payment data. Use dollars (e.g. $1,234.56) when mentioning amounts.
You have access to the full list of payments including dates, amounts, counterparties, descriptions, and statuses.
If the question cannot be answered from the data, say so and suggest what data would help."""

    user_content = f"Payment data:\n{data_blurb}\n\nQuestion: {question}"

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_content},
            ],
            max_tokens=500,
        )
    except APITimeoutError:
        logger.exception("OpenAI request timed out")
        raise CopilotError("Copilot request timed out. Please try again.", status_code=504)
    except APIConnectionError:
        logger.exception("Could not connect to OpenAI API")
        raise CopilotError("Could not connect to the AI service. Check OPENAI_BASE_URL.", status_code=502)
    except APIError as exc:
        logger.exception("OpenAI API error: %s", exc.message)
        # Surface safe detail; avoid leaking the API key
        safe_msg = exc.message if exc.message else "Unknown API error"
        raise CopilotError(f"AI service error: {safe_msg}", status_code=502)
    except Exception:
        logger.exception("Unexpected error calling OpenAI")
        raise CopilotError("Unexpected error while contacting the AI service.", status_code=502)

    answer = response.choices[0].message.content or "I couldn't generate an answer."
    return CopilotAskResponse(
        answer=answer,
        sources_used=["cashflow_summary_30d"],
    )
