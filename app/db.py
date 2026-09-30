from datetime import datetime, timezone

from google.cloud.firestore_v1 import FieldFilter

from app.firebase_client import get_db

# Firestore document shape (per-user isolation — every path is scoped under the verified
# Clerk user id, never a client-supplied id):
#   users/{clerkUserId}/apiKeys/{provider}   -> {encrypted_key: bytes, created_at}
#   users/{clerkUserId}/settings/config      -> {<key>: <value>, ...} single doc
#   users/{clerkUserId}/queries/{autoId}     -> {ts, query, embedding, answer, cache_hit,
#                                                 model_used, input_tokens, output_tokens,
#                                                 cost_usd, latency_ms}


def _user_ref(user_id: str):
    return get_db().collection("users").document(user_id)


def insert_record(
    user_id: str,
    query: str,
    embedding: list[float],
    answer: str,
    cache_hit: bool,
    model_used: str | None,
    input_tokens: int | None,
    output_tokens: int | None,
    cost_usd: float | None,
    latency_ms: float,
) -> None:
    _user_ref(user_id).collection("queries").add(
        {
            "ts": datetime.now(timezone.utc).isoformat(),
            "query": query,
            "embedding": embedding,
            "answer": answer,
            "cache_hit": cache_hit,
            "model_used": model_used,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": cost_usd,
            "latency_ms": latency_ms,
        }
    )


def fetch_all_cached(user_id: str) -> list[dict]:
    docs = (
        _user_ref(user_id)
        .collection("queries")
        .where(filter=FieldFilter("cache_hit", "==", False))
        .stream()
    )
    return [d.to_dict() for d in docs]


def fetch_all_queries(user_id: str) -> list[dict]:
    docs = _user_ref(user_id).collection("queries").stream()
    return [d.to_dict() for d in docs]


def fetch_recent_queries(user_id: str, limit: int) -> list[dict]:
    docs = (
        _user_ref(user_id)
        .collection("queries")
        .order_by("ts", direction="DESCENDING")
        .limit(limit)
        .stream()
    )
    return [d.to_dict() for d in docs]


def upsert_api_key(user_id: str, provider: str, encrypted_key: bytes) -> None:
    _user_ref(user_id).collection("apiKeys").document(provider).set(
        {
            "encrypted_key": encrypted_key,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )


def get_encrypted_key(user_id: str, provider: str) -> bytes | None:
    doc = _user_ref(user_id).collection("apiKeys").document(provider).get()
    if not doc.exists:
        return None
    return doc.to_dict()["encrypted_key"]


def list_api_keys(user_id: str) -> list[dict]:
    docs = _user_ref(user_id).collection("apiKeys").stream()
    result = []
    for d in docs:
        data = d.to_dict()
        result.append(
            {
                "provider": d.id,
                "encrypted_key": data["encrypted_key"],
                "created_at": data["created_at"],
            }
        )
    return result


def delete_api_key(user_id: str, provider: str) -> None:
    _user_ref(user_id).collection("apiKeys").document(provider).delete()


def set_setting(user_id: str, key: str, value: str) -> None:
    _user_ref(user_id).collection("settings").document("config").set(
        {key: value}, merge=True
    )


def get_setting(user_id: str, key: str) -> str | None:
    doc = _user_ref(user_id).collection("settings").document("config").get()
    if not doc.exists:
        return None
    return doc.to_dict().get(key)
