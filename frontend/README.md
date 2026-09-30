# Cache & Routing Analytics Dashboard

Read-only Next.js dashboard for the semantic caching & cost-aware RAG router
backend. Polls the FastAPI service every 4s so stats and the recent-queries
feed update live, with no manual refresh.

## Run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`. It expects the FastAPI backend running at
`http://localhost:8321` (see the project root `CLAUDE.md` / `README.md` for
how to start it: `uvicorn app.main:app --port 8321` from the repo root, with
the venv active). CORS on the backend already allows `localhost:3000`.

If the backend isn't reachable, the dashboard shows a distinct "can't reach
the API" banner instead of crashing or showing blank/NaN values, and
reconnects automatically once the backend comes up. Zero rows in `cache.db`
renders as an explicit "no data yet" state, not an error.

To point the dashboard at a different backend URL, set
`NEXT_PUBLIC_API_BASE` (e.g. in `.env.local`).

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4 (light/dark via `prefers-color-scheme`, tuned palettes —
  not a straight inversion)
- Framer Motion for animated stat counters, card entrances, and live-row
  highlighting in the queries feed
- GSAP for the header's staggered intro sequence

## Seeding fake data for a visual check

`cache.db` starts empty (no API key has been available to run real `/query`
calls yet). To sanity-check the populated state locally without hitting the
real Anthropic API, insert rows directly:

```bash
cd ..
source .venv/bin/activate
python - <<'EOF'
import random, sqlite3, time
from app.db import init_db, DB_PATH

init_db()
conn = sqlite3.connect(DB_PATH)
models = ["claude-haiku-4-5-20251001", "claude-sonnet-5"]
for i in range(30):
    hit = random.random() < 0.4
    model = None if hit else random.choice(models)
    cost = 0.0 if hit else round(random.uniform(0.0005, 0.02), 6)
    latency = random.uniform(15, 60) if hit else random.uniform(400, 2200)
    conn.execute(
        "INSERT INTO queries (ts, query, embedding, answer, cache_hit, model_used, "
        "input_tokens, output_tokens, cost_usd, latency_ms) VALUES "
        "(datetime('now', ?), ?, '[]', 'fake answer', ?, ?, 120, 80, ?, ?)",
        (f"-{i} minutes", f"fake query {i}", int(hit), model, cost, latency),
    )
conn.commit()
conn.close()
EOF
```

Then clear it back out when done:

```bash
python -c "import sqlite3; c = sqlite3.connect('cache.db'); c.execute('DELETE FROM queries'); c.commit()"
```
