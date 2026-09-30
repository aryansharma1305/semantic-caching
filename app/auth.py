import os

import jwt
from fastapi import HTTPException, Request
from jwt import PyJWKClient

CLERK_JWKS_URL = os.environ["CLERK_JWKS_URL"]
CLERK_ISSUER = os.environ["CLERK_ISSUER"]

# Cached across requests — PyJWKClient handles its own key-fetch caching internally.
_jwks_client = PyJWKClient(CLERK_JWKS_URL)


def get_current_user_id(request: Request) -> str:
    """FastAPI dependency: verifies the Clerk session JWT from the Authorization header
    against Clerk's JWKS and returns the verified user id (`sub` claim). Never trusts a
    user id supplied in the request body/params — this is the only source of identity."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth_header[len("bearer "):].strip()

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
