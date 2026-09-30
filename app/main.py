import time

from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app import providers
from app.auth import get_current_user_id
from app.crypto import decrypt, encrypt, mask
from app.db import (
    delete_api_key,
    fetch_all_queries,
    fetch_recent_queries,
    get_setting,
    insert_record,
    list_api_keys,
    set_setting,
    upsert_api_key,
)
from app.embeddings import embed
from app.router import answer_query
from app.semantic_cache import lookup
from app.tokens import generate_token, list_tokens, revoke_token

app = FastAPI(title="Semantic Caching & Cost-Aware Router")

# Dev-only: the Next.js dashboard runs on a different port (3000) than the API (8321).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str


class ApiKeyRequest(BaseModel):
    provider: str
    api_key: str


class CreateTokenRequest(BaseModel):
    name: str = "Default"


class ActiveProviderRequest(BaseModel):
    provider: str


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/query")
def query(req: QueryRequest, user_id: str = Depends(get_current_user_id)) -> dict:
    start = time.perf_counter()
    query_embedding = embed(req.query)

    cached = lookup(user_id, query_embedding)
    if cached is not None:
        answer, similarity = cached
        latency_ms = (time.perf_counter() - start) * 1000
        insert_record(
            user_id=user_id,
            query=req.query,
            embedding=query_embedding,
            answer=answer,
            cache_hit=True,
            model_used=None,
            input_tokens=None,
            output_tokens=None,
            cost_usd=0.0,
            latency_ms=latency_ms,
        )
        return {
            "answer": answer,
            "cache_hit": True,
            "similarity": similarity,
            "latency_ms": latency_ms,
        }

    try:
        answer, model_used, input_tokens, output_tokens, cost = answer_query(
            user_id, req.query
        )
    except (providers.ProviderNotConfigured, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except providers.ProviderCallError as e:
        # Upstream provider rejected the request (bad/expired key, rate limit, etc).
        # 502: our server is fine, the thing it depends on isn't. Message is provider-
        # supplied and never contains the key itself.
        raise HTTPException(status_code=502, detail=f"{e.provider} API error: {e}")
    latency_ms = (time.perf_counter() - start) * 1000
    insert_record(
        user_id=user_id,
        query=req.query,
        embedding=query_embedding,
        answer=answer,
        cache_hit=False,
        model_used=model_used,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=cost,
        latency_ms=latency_ms,
    )
    return {
        "answer": answer,
        "cache_hit": False,
        "model_used": model_used,
        "cost_usd": cost,
        "latency_ms": latency_ms,
    }


@app.get("/stats")
def stats(user_id: str = Depends(get_current_user_id)) -> dict:
    # Firestore has no SUM/AVG/GROUP BY — client-side rollup over this user's own query
    # docs. Fine at small per-user scale; revisit with a maintained counter doc only if
    # a user's query volume makes this rollup slow.
    rows = fetch_all_queries(user_id)
    total = len(rows)
    hits = sum(1 for r in rows if r["cache_hit"])
    total_latency = sum(r["latency_ms"] for r in rows)
    total_cost = sum(r["cost_usd"] or 0.0 for r in rows)
    by_model: dict[str, int] = {}
    for r in rows:
        if not r["cache_hit"]:
            by_model[r["model_used"]] = by_model.get(r["model_used"], 0) + 1

    return {
        "total_queries": total,
        "cache_hits": hits,
        "cache_hit_rate": (hits / total) if total else 0.0,
        "avg_latency_ms": (total_latency / total) if total else 0.0,
        "total_cost_usd": total_cost,
        "requests_by_model": by_model,
    }


@app.get("/queries")
def recent_queries(
    limit: int = 50, user_id: str = Depends(get_current_user_id)
) -> list[dict]:
    rows = fetch_recent_queries(user_id, limit)
    return [
        {
            "ts": row["ts"],
            "query": row["query"],
            "cache_hit": row["cache_hit"],
            "model_used": row["model_used"],
            "cost_usd": row["cost_usd"],
            "latency_ms": row["latency_ms"],
        }
        for row in rows
    ]


# --- Settings / API keys -----------------------------------------------------------
# Security notes (read before touching this section):
# - The raw key is only ever in memory for the duration of this request; it's encrypted
#   before touching disk (Firestore) and the plaintext is never logged (don't add logging
#   here that prints `req` or `api_key`).
# - No endpoint below ever returns a decrypted key. `mask()` is a one-way display string;
#   `GET /settings/api-keys` and the return value of POST both only ever send the mask.
# - Keys arrive via POST body only, never query params (which land in server access logs
#   and browser history).
# - Every read/write below is scoped to `user_id`, verified from the Clerk session token —
#   never from anything in the request body/params.


@app.get("/settings/providers")
def list_providers(user_id: str = Depends(get_current_user_id)) -> list[dict]:
    return [
        {
            "provider": provider_id,
            "display_name": meta["display_name"],
            "configured": providers.is_configured(user_id, provider_id),
        }
        for provider_id, meta in providers.PROVIDERS.items()
    ]


@app.post("/settings/api-key")
def save_api_key(
    req: ApiKeyRequest, user_id: str = Depends(get_current_user_id)
) -> dict:
    if req.provider not in providers.PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider '{req.provider}'")
    if not req.api_key or not req.api_key.strip():
        raise HTTPException(status_code=400, detail="api_key must not be empty")

    upsert_api_key(user_id, req.provider, encrypt(req.api_key))

    # First configured provider becomes active automatically so /query works immediately.
    if get_setting(user_id, "active_provider") is None:
        set_setting(user_id, "active_provider", req.provider)

    return {"provider": req.provider, "masked_key": mask(req.api_key)}


@app.get("/settings/api-keys")
def get_api_keys(user_id: str = Depends(get_current_user_id)) -> list[dict]:
    active = get_setting(user_id, "active_provider")
    return [
        {
            "provider": row["provider"],
            "masked_key": mask(decrypt(row["encrypted_key"])),
            "created_at": row["created_at"],
            "active": row["provider"] == active,
        }
        for row in list_api_keys(user_id)
    ]


@app.delete("/settings/api-key/{provider}")
def remove_api_key(
    provider: str, user_id: str = Depends(get_current_user_id)
) -> dict:
    delete_api_key(user_id, provider)
    if get_setting(user_id, "active_provider") == provider:
        set_setting(user_id, "active_provider", "")
    return {"provider": provider, "deleted": True}


@app.post("/settings/active-provider")
def set_active_provider(
    req: ActiveProviderRequest, user_id: str = Depends(get_current_user_id)
) -> dict:
    if req.provider not in providers.PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider '{req.provider}'")
    if not providers.is_configured(user_id, req.provider):
        raise HTTPException(
            status_code=400,
            detail=f"Provider '{req.provider}' has no API key configured yet",
        )
    set_setting(user_id, "active_provider", req.provider)
    return {"active_provider": req.provider}


# --- Product API tokens -------------------------------------------------------------
# Distinct from the provider keys above: these authenticate a caller of POST /query as
# an alternative to a Clerk session JWT, so a user's own backend can call this API
# without a browser session (see app/tokens.py, app/auth.py). Same rule as provider
# keys: the plaintext token is returned exactly once, at creation, and never again.


@app.post("/settings/tokens")
def create_token(
    req: CreateTokenRequest, user_id: str = Depends(get_current_user_id)
) -> dict:
    return generate_token(user_id, req.name)


@app.get("/settings/tokens")
def get_tokens(user_id: str = Depends(get_current_user_id)) -> list[dict]:
    return list_tokens(user_id)


@app.delete("/settings/tokens/{token_id}")
def remove_token(
    token_id: str, user_id: str = Depends(get_current_user_id)
) -> dict:
    if not revoke_token(user_id, token_id):
        raise HTTPException(status_code=404, detail="Token not found")
    return {"id": token_id, "revoked": True}
