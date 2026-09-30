import re

from app import providers
from app.db import get_setting

COMPLEXITY_KEYWORDS = [
    "why", "compare", "analyze", "explain in depth", "trade-off", "tradeoff",
    "design", "architecture", "prove", "derive", "multi-step", "step by step",
]


def choose_tier(query: str) -> str:
    """Cheap heuristic routing — no LLM call involved in the decision itself.
    Returns 'small' or 'large'; provider-specific model names live in providers.py."""
    word_count = len(query.split())
    has_complexity_keyword = any(
        re.search(rf"\b{kw}\b", query.lower()) for kw in COMPLEXITY_KEYWORDS
    )
    question_marks = query.count("?")

    if word_count > 40 or has_complexity_keyword or question_marks > 1:
        return "large"
    return "small"


def active_provider(user_id: str) -> str | None:
    value = get_setting(user_id, "active_provider")
    return value or None  # "" (cleared) is treated the same as unset


def answer_query(user_id: str, query: str) -> tuple[str, str, int, int, float]:
    """Returns (answer, model_used, input_tokens, output_tokens, cost_usd).
    Raises providers.ProviderNotConfigured if no active provider / key is set."""
    provider = active_provider(user_id)
    if provider is None:
        raise providers.ProviderNotConfigured(
            "No active provider set. Configure a key via POST /settings/api-key, "
            "then POST /settings/active-provider."
        )
    tier = choose_tier(query)
    result = providers.call(user_id, provider, tier, query)
    return result.answer, result.model, result.input_tokens, result.output_tokens, result.cost_usd
