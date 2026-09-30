import hashlib
import secrets

from app.db import (
    create_app_token,
    list_app_tokens,
    resolve_app_token,
    revoke_app_token,
    touch_app_token,
)

# Product-level API tokens — distinct from the provider (Anthropic/OpenAI) keys in
# app/providers.py. These authenticate a server-to-server caller of POST /query as an
# alternative to a Clerk session JWT (see app/auth.py), so a user's own backend can call
# this API without a browser session. Only the SHA-256 hash is ever stored; the plaintext
# token exists only in the HTTP response of the creating request and is never persisted,
# logged, or retrievable again — same "never echo a secret back" posture as provider keys.
TOKEN_PREFIX = "sr_live_"


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def generate_token(user_id: str, name: str) -> dict:
    """Returns the record including the one-time plaintext `token` field. Caller must
    display it once and never fetch it again — there is no retrieval path by design."""
    secret = secrets.token_urlsafe(32)
    token = f"{TOKEN_PREFIX}{secret}"
    token_hash = _hash(token)
    prefix_display = token[: len(TOKEN_PREFIX) + 6]
    record = create_app_token(user_id, token_hash, prefix_display, name)
    return {**record, "token": token}


def list_tokens(user_id: str) -> list[dict]:
    return list_app_tokens(user_id)


def revoke_token(user_id: str, token_id: str) -> bool:
    return revoke_app_token(user_id, token_id)


def resolve_token(token: str) -> str | None:
    if not token.startswith(TOKEN_PREFIX):
        return None
    token_hash = _hash(token)
    user_id = resolve_app_token(token_hash)
    if user_id is not None:
        touch_app_token(user_id, token_hash)
    return user_id
