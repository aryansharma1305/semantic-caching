# Semantic Caching & Cost-Aware Router

A RAG service that caches answers by embedding similarity and routes each query to a
small or large model based on estimated difficulty, tracking cost and latency per request.

See `CLAUDE.md` for full design decisions and rationale.

## Run it

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-...
uvicorn app.main:app --port 8321
```

## Endpoints
- `POST /query` — `{"query": "..."}` → cache hit (near-duplicate question, no LLM call) or
  cache miss (routed to `claude-haiku-4-5` or `claude-sonnet-5` based on a cheap difficulty
  heuristic, then cached for next time).
- `GET /stats` — aggregate cache hit rate, average latency, total cost, and request counts
  per model.
- `GET /health` — liveness check.

## How caching works
Each query is embedded locally (`all-MiniLM-L6-v2`, no API cost). If cosine similarity to a
previously answered query is ≥ 0.92, the cached answer is returned with zero LLM cost and
sub-50ms latency. Otherwise the query is routed and the new answer is cached for future hits.

## How routing works
A cheap heuristic (word count, question-complexity keywords, multiple question marks) decides
small vs. large model *before* any LLM call — the decision itself costs nothing, which is the
point: an LLM-based router would erase the savings it's meant to create.

## Results
Not yet measured — running real queries against this service requires an `ANTHROPIC_API_KEY`,
which wasn't available in the build environment. To fill in this section:

1. Run a batch of test queries (mix of repeats, near-duplicates, and novel questions) against
   `/query`.
2. Pull `/stats` before and after.
3. Report: cache hit rate, cost saved (`cache_hits × avg_cost_of_a_miss`), and latency
   comparison (cache hit vs. cache miss, p50/p95).

Resume line once measured: "Added semantic caching and model routing to a RAG service,
reducing LLM cost by X% and p95 latency by Yms while maintaining answer quality."
