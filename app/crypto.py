import os
from pathlib import Path

from cryptography.fernet import Fernet

# Encryption at rest for provider API keys stored in each user's Firestore document. The
# Fernet master key lives in the FERNET_SECRET_KEY env var, never on disk — a real
# multi-user deployed service can't use a local secret.key file (no single "this machine"
# to protect). Locally, if the env var isn't set yet, we generate one and persist it to
# the gitignored .env file so it survives restarts — never commit .env.
ENV_PATH = Path(__file__).parent.parent / ".env"

_fernet: Fernet | None = None


def _load_or_create_key() -> bytes:
    existing = os.environ.get("FERNET_SECRET_KEY")
    if existing:
        return existing.encode()

    key = Fernet.generate_key()
    with ENV_PATH.open("a") as f:
        f.write(f"\nFERNET_SECRET_KEY={key.decode()}\n")
    os.environ["FERNET_SECRET_KEY"] = key.decode()
    return key


def get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(_load_or_create_key())
    return _fernet


def encrypt(plaintext: str) -> bytes:
    return get_fernet().encrypt(plaintext.encode())


def decrypt(ciphertext: bytes) -> str:
    return get_fernet().decrypt(ciphertext).decode()


def mask(plaintext: str) -> str:
    """Display-only representation. Never derive the real key from this."""
    if len(plaintext) <= 8:
        return "*" * len(plaintext)
    return f"{plaintext[:5]}{'*' * 8}{plaintext[-4:]}"
