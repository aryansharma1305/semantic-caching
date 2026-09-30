import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

_DEFAULT_SERVICE_ACCOUNT_PATH = Path(__file__).parent.parent / "firebase-service-account.json"

_app: firebase_admin.App | None = None


def get_db() -> firestore.Client:
    global _app
    if _app is None:
        cred_path = os.environ.get(
            "FIREBASE_SERVICE_ACCOUNT_PATH", str(_DEFAULT_SERVICE_ACCOUNT_PATH)
        )
        cred = credentials.Certificate(cred_path)
        _app = firebase_admin.initialize_app(cred)
    return firestore.client()
