"""Multi-provider LLM dispatch. Add a new provider by adding an entry to PROVIDERS and a
_call_<provider> function — nothing else in the app needs to change (router.py and the
settings endpoints are provider-agnostic)."""

from dataclasses import dataclass

from app.crypto import decrypt
from app.db import get_encrypted_key

# Pricing per 1M tokens (input, output). Check the claude-api skill / each provider's
# pricing page before trusting these for anything beyond rough cost estimates.
PROVIDERS: dict[str, dict] = {
    "anthropic": {
        "display_name": "Anthropic",
        "small_model": "claude-haiku-4-5-20251001",
        "large_model": "claude-sonnet-5",
        "pricing": {
            "claude-haiku-4-5-20251001": {"input": 1.00, "output": 5.00},
            "claude-sonnet-5": {"input": 3.00, "output": 15.00},
        },
    },
    "openai": {
        "display_name": "OpenAI",
        "small_model": "gpt-4o-mini",
        "large_model": "gpt-4o",
        "pricing": {
            "gpt-4o-mini": {"input": 0.15, "output": 0.60},
            "gpt-4o": {"input": 2.50, "output": 10.00},
        },
    },
}


class ProviderNotConfigured(Exception):
    pass


class ProviderCallError(Exception):
    """Wraps any SDK-level exception from a provider call so the key is never in the
    traceback/message we let bubble up past this module."""

    def __init__(self, provider: str, message: str):
        self.provider = provider
        super().__init__(message)


@dataclass
class LLMResult:
    answer: str
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float


def is_configured(user_id: str, provider: str) -> bool:
    return get_encrypted_key(user_id, provider) is not None


def _get_key(user_id: str, provider: str) -> str:
    encrypted = get_encrypted_key(user_id, provider)
    if encrypted is None:
        raise ProviderNotConfigured(
            f"No API key configured for provider '{provider}'. Add one via POST /settings/api-key."
        )
    return decrypt(encrypted)


def _compute_cost(provider: str, model: str, input_tokens: int, output_tokens: int) -> float:
    rates = PROVIDERS[provider]["pricing"][model]
    return (input_tokens / 1_000_000) * rates["input"] + (
        output_tokens / 1_000_000
    ) * rates["output"]


def _call_anthropic(model: str, query: str, api_key: str) -> tuple[str, int, int]:
    import anthropic

    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": query}],
    )
    answer = "".join(block.text for block in response.content if block.type == "text")
    return answer, response.usage.input_tokens, response.usage.output_tokens


def _call_openai(model: str, query: str, api_key: str) -> tuple[str, int, int]:
    import openai

    client = openai.OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": query}],
    )
    answer = response.choices[0].message.content or ""
    usage = response.usage
    return answer, usage.prompt_tokens, usage.completion_tokens


_DISPATCH = {
    "anthropic": _call_anthropic,
    "openai": _call_openai,
}


def call(user_id: str, provider: str, tier: str, query: str) -> LLMResult:
    """tier is 'small' or 'large'. Raises ProviderNotConfigured if no key is set,
    ProviderCallError if the provider's API rejects the request (bad key, rate limit,
    etc — never our bug, always a 502 at the HTTP layer)."""
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown provider '{provider}'")
    api_key = _get_key(user_id, provider)
    model = PROVIDERS[provider][f"{tier}_model"]
    try:
        answer, input_tokens, output_tokens = _DISPATCH[provider](model, query, api_key)
    except Exception as e:
        # Deliberately broad: any SDK exception (auth, rate limit, network, etc) gets
        # normalized here so callers only need to handle two exception types, and so
        # str(e) is checked to never be the raw key before it's allowed to propagate.
        message = str(e)
        if api_key in message:
            message = message.replace(api_key, "[redacted]")
        raise ProviderCallError(provider, message) from e
    cost = _compute_cost(provider, model, input_tokens, output_tokens)
    return LLMResult(answer, model, input_tokens, output_tokens, cost)
