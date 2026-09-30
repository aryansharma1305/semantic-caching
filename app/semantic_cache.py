from app.db import fetch_all_cached
from app.embeddings import cosine_similarity

SIMILARITY_THRESHOLD = 0.92


def lookup(user_id: str, query_embedding: list[float]) -> tuple[str, float] | None:
    """Return (cached_answer, similarity) for the best match above threshold, else None.
    Only searches the given user's own cached queries — cache never crosses tenants."""
    best_answer = None
    best_sim = -1.0
    for row in fetch_all_cached(user_id):
        sim = cosine_similarity(query_embedding, row["embedding"])
        if sim > best_sim:
            best_sim = sim
            best_answer = row["answer"]
    if best_answer is not None and best_sim >= SIMILARITY_THRESHOLD:
        return best_answer, best_sim
    return None
