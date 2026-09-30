import os

import jwt
from fastapi import HTTPException, Request
from jwt import PyJWKClient

from app.tokens import TOKEN_PREFIX, resolve_token

CLERK_JWKS_URL = os.environ["CLERK_JWKS_URL"]
CLERK_ISSUER = os.environ["CLERK_ISSUER"]

# Cached across requests — PyJWKClient handles its own key-fetch caching internally.
_jwks_client = PyJWKClient(CLERK_JWKS_URL)


def get_current_user_id(request: Request) -> str:
    """FastAPI dependency: resolves the verified user id from the Authorization header,
    either a Clerk session JWT (browser/dashboard use) or a product-level API token
    (server-to-server use — see app/tokens.py). Never trusts a user id supplied in the
    request body/params — this is the only source of identity."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth_header[len("bearer "):].strip()

    if token.startswith(TOKEN_PREFIX):
        user_id = resolve_token(token)
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid or revoked API token")
        return user_id

    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject")
    return user_id
