# Semantic Caching & Cost-Aware Routing for RAG

## What this is
A RAG service that (1) caches answers by embedding similarity so repeated/near-duplicate
questions skip the LLM entirely, and (2) routes each query to a small or large model based
on estimated difficulty, while tracking cost and latency per request on a dashboard.

This is project 1 of 3 resume-portfolio RAG projects (see sibling folders for the others:
permission-aware multi-tenant RAG, GraphRAG for multi-hop questions). Each project lives in
its own directory with its own CLAUDE.md so context doesn't bleed across projects.

**Resume line this is building toward:** "Added semantic caching and model routing to a RAG
service, reducing LLM cost and p95 latency while maintaining answer quality."

## Architecture decisions (already made — don't re-derive, just follow)
- **Language/framework:** Python + FastAPI. Single service, no microservices split.
- **Embeddings:** `sentence-transformers` (`all-MiniLM-L6-v2`), local, no API cost per embed.
- **Semantic cache:** Store `(query_embedding, query_text, answer, model_used, cost, latency)`
  rows in SQLite. On a new query, embed it, cosine-similarity against cached embeddings
  (brute-force is fine at this scale — no need for a vector DB), and return the cached answer
  if similarity > threshold (start at 0.92, make it tunable).
- **Model router:** Two tiers — a small/cheap model and a large/capable model. Route by a
  cheap difficulty heuristic first (query length, question complexity keywords, or a tiny
  classifier), not by calling the large model to decide (that would defeat the cost savings).
  `router.choose_tier()` returns `"small"`/`"large"`, provider-agnostic. Provider-specific
  model names + pricing live in `app/providers.py::PROVIDERS`. Anthropic:
  `claude-haiku-4-5-20251001` / `claude-sonnet-5`. OpenAI: `gpt-4o-mini` / `gpt-4o`. Check
  the `claude-api` skill / each provider's pricing page before trusting the hardcoded rates.
- **Multi-provider + API key security:** User can add a key for any supported provider
  (currently Anthropic, OpenAI — add more by extending `PROVIDERS` in `providers.py` plus
  a `_call_<provider>` function; nothing else needs to change) via `POST /settings/api-key`,
  and pick which one is active via `POST /settings/active-provider`. Security model (don't
  relax this without re-deriving why it's there):
  - Keys are encrypted at rest with Fernet (`app/crypto.py`); the symmetric key lives in
    `secret.key` at the project root, `chmod 600`, gitignored — never commit it or `cache.db`.
  - No endpoint ever returns a decrypted key. Every read path returns `mask()` output only
    (`sk-an********CDEF` style). The frontend (`SettingsPanel.tsx`) never persists the raw
    key to localStorage/cookies/logs — it lives in React state only while the user is
    typing, and is cleared immediately after every save attempt and on modal close.
  - Keys travel via POST body only, never query params (query params land in access logs
    and browser history).
  - Provider SDK errors (bad key, rate limit, etc.) are normalized to `ProviderCallError`
    in `providers.py` and surfaced as HTTP 502 — and the error message is scrubbed for the
    literal key substring before it's allowed to propagate, so a leaked exception message
    can't leak the key either.
- **Cost/latency tracking:** Every request (cache hit or miss) logs to the same SQLite table:
  timestamp, query, cache_hit bool, model_used, input/output tokens, computed cost, latency_ms.
- **Dashboard:** Upgraded from "nice-to-have" to in-scope. Next.js frontend (App Router,
  TypeScript) in `frontend/`, styled with Tailwind, animated with Framer Motion + GSAP.
  Consumes the FastAPI backend's `GET /stats` (aggregates) and `GET /queries?limit=N`
  (recent log, for time-series/charts) over CORS on `localhost:8321`. Interactive =
  live-updating (poll or refetch on an interval), animated transitions on number changes,
  not just a static table.
- **No vector DB, no Redis** — still out of scope.
- **SaaS pivot (2026-10-01):** This project is becoming a real multi-tenant SaaS, not just
  a local single-user demo. This *supersedes* the earlier "no auth, out of scope" line and
  the "multi-tenancy is project 2" line under Explicitly Out of Scope below — multi-tenancy
  now lives here, project 2 (permission-aware RAG) is a different concern (role-based
  retrieval filtering within one tenant, not user-level account isolation).
  - **Auth:** Clerk. Next.js frontend wraps the app in `<ClerkProvider>`; a public landing
    page lives outside the auth gate, the dashboard + settings move behind it. Backend
    verifies the Clerk session token on every request (via Clerk's JWKS) and extracts a
    user id — every Firestore read/write is scoped to that user id. No endpoint trusts a
    user id from the request body/params; it only trusts what it verified from the token.
  - **Database:** Firebase Firestore replaces SQLite. Document shape:
    `users/{clerkUserId}/apiKeys/{provider}`, `users/{clerkUserId}/settings/config`,
    `users/{clerkUserId}/queries/{autoId}`. Known tradeoff accepted knowingly: `/stats`
    was SQL aggregation (`SUM`/`AVG`/`GROUP BY`); Firestore has no equivalent, so stats
    become either a client-side rollup over fetched docs (fine at small scale) or a
    maintained counter doc updated on every write (fine at larger scale) — start with the
    simple client-side rollup, don't build the counter doc until it's actually needed.
  - **Key encryption changes shape too:** the old model assumed one local user and a
    `secret.key` file on disk. In a real multi-user deployed service, the Fernet master
    key must live in an environment variable (`FERNET_SECRET_KEY`), not a file next to the
    code — the backend process reads it from env, never writes it to disk, never commits
    it. Per-provider keys are still encrypted with this one master key before being stored
    in each user's Firestore document; still masked-only on every read path; still never
    echoed back; still redacted from error messages. These invariants don't change just
    because the storage backend did.
  - **Landing page:** public marketing page (hero, feature highlights drawn from what's
    actually built — semantic caching, cost-aware routing, multi-provider support — plus a
    sign-up CTA through Clerk). Not gated. Lives at `/`, dashboard moves to `/dashboard`.
  - **Credentials:** Clerk publishable/secret keys and the Firebase service account are
    the user's own accounts — Claude cannot create these. Scaffold everything against env
    var placeholders first; wire real values only once the user supplies them, and never
    echo the service account JSON or secret keys back in chat once received — treat them
    like the API keys above.

## Status
- [x] Scaffold FastAPI app + SQLite schema — `app/main.py`, `app/db.py`
- [x] Embedding + cosine-similarity cache lookup — `app/embeddings.py`, `app/semantic_cache.py`
- [x] Difficulty heuristic + router to small/large model — `app/router.py`
- [x] Cost/latency logging — wired into `POST /query` in `app/main.py`
- [x] `/stats` endpoint
- [x] `GET /queries?limit=N` recent-log endpoint (for frontend charts) + CORS middleware
      for `localhost:3000`
- [x] Next.js dashboard (`frontend/`) — Tailwind + Framer Motion + GSAP, consumes
      `/stats` and `/queries`. Polls every 4s, animated stat counters, cache-hit-vs-miss
      latency bars, model breakdown, live recent-queries feed, distinct loading/error/
      empty/populated states, responsive, light+dark themed (not inverted). Builds clean
      (`npm run build`, no type errors); verified in-browser via the `browse` skill — no
      console errors, empty state and a temporarily-seeded populated state both render
      correctly, polling updates the DOM live without a manual refresh. See
      `frontend/README.md` to run it.
- [x] Multi-provider support (`app/providers.py`) — Anthropic + OpenAI, tier-based model
      selection, pricing table, normalized `ProviderCallError`/`ProviderNotConfigured`.
- [x] Encrypted API key storage + settings endpoints (`/settings/providers`,
      `/settings/api-key` POST/DELETE, `/settings/api-keys`, `/settings/active-provider`)
      — verified: ciphertext on disk contains no plaintext substring of the key,
      `secret.key` is `chmod 600` and gitignored, masked-only in every response, deleting
      the active provider correctly falls back to "no active provider" (400) instead of
      crashing (fixed a real bug here: empty-string vs `None` for the active-provider
      setting), and a bad/fake key surfaces as a clean 502 with the key string redacted
      from the error message — confirmed against `server.log` directly.
- [x] Frontend `SettingsPanel.tsx` — provider dropdown + masked password input + show/hide
      toggle, key list with masked previews and active/remove controls, wired into
      `page.tsx`. Builds clean (`npm run build`, no type errors). Not click-tested in a
      real browser this session (no Chrome extension connection available) — verified via
      build + direct curl simulation of the exact requests the component makes (including
      the `Origin: http://localhost:3000` CORS check). **Next session: actually click
      through Add key → Use → Remove in a browser before trusting the UI blindly.**
- [ ] **Still blocked on real numbers:** no real API key has been exercised end-to-end yet
      (only fake keys, to test the encryption/error paths). Everything up to the actual
      provider call is verified working. Next session: add a real key via the Settings
      panel (or `POST /settings/api-key`), run a batch of real queries (mix of
      repeats/near-duplicates/novel questions), then fill in the "Results" section of
      `README.md` with real hit rate / cost / latency numbers.

**Where things stand (2026-10-01):** backend (caching, routing, multi-provider, encrypted
key storage) and frontend (dashboard + settings panel) are both fully built. Backend
security paths verified directly (encryption, masking, error redaction, CORS). Frontend
settings UI verified by build + direct API simulation only, not a live click-through —
flag that if the user reports it doesn't work, that's the first place to look.

- [x] **SaaS pivot complete: Clerk + Firestore + landing page, end to end.**
      - **Auth:** `@clerk/nextjs` installed via `clerk init` against app
        `app_3K3nOWfKiKpguaNvSrPxOrfiffE`. `ClerkProvider` wraps `<body>` in
        `app/layout.tsx`. Route protection is resource-based, not middleware-matched —
        `app/dashboard/layout.tsx` calls `await auth.protect()` server-side (the
        `createRouteMatcher` middleware pattern is deprecated in `@clerk/nextjs` 7.9.8;
        confirmed no deprecation warning with the resource-based approach). `proxy.ts`
        just runs bare `clerkMiddleware()`.
      - **Backend auth:** `app/auth.py` verifies the Clerk session JWT via
        `PyJWKClient` against `CLERK_JWKS_URL`/`CLERK_ISSUER` (in `.env`, derived from
        the publishable key's encoded domain — not a secret, safe to keep there). Every
        endpoint except `/health` depends on `get_current_user_id`; no endpoint trusts a
        user id from the request body. Verified: 401 on missing/garbage token.
      - **Firestore:** `firebase-service-account.json` (project `saas-817e1`) lives at
        the backend root, `chmod 600`, gitignored — moved out of `~/Downloads`, never
        printed to chat. `app/firebase_client.py` inits the admin SDK from
        `FIREBASE_SERVICE_ACCOUNT_PATH`. `app/db.py` fully rewritten from SQLite to
        Firestore: `users/{clerkUserId}/{apiKeys,settings,queries}` per the schema
        decided above. `app/providers.py`/`app/router.py`/`app/semantic_cache.py` all
        take `user_id` as an explicit first argument now — cache lookups and provider
        keys never cross accounts. `/stats` is a client-side rollup over the user's own
        query docs (Firestore has no `SUM`/`AVG`/`GROUP BY`). Verified: a direct
        Firestore round-trip write/read/delete succeeded against the real project.
      - **Key encryption:** `app/crypto.py` now reads the Fernet master key from
        `FERNET_SECRET_KEY` (env), not a `secret.key` file — generates and persists it
        to the gitignored `.env` on first run if missing. `cache.db` and the old
        `secret.key` path are gone; `app/db.py` has zero SQLite references left (grepped
        to confirm).
      - **Landing page** (`app/page.tsx` + `components/landing/`): real marketing page
        replaces the old direct-to-dashboard `/`. Hero has an animated, GSAP-driven
        "live query console" demonstrating the actual cache-hit/routing mechanism with
        illustrative (labeled-as-simulated) data — not a fabricated benchmark claim.
        `MechanismFlow` visualizes the real 4-stage pipeline (embed → compare → decide →
        log) with data-representative visuals, not generic icons. `SecuritySection`
        states only real, already-built security properties (encrypted at rest, masked,
        never returned, per-account isolation). No invented testimonials, logos, or
        pricing — per `PRODUCT.md`'s constraint that hit-rate/cost numbers aren't
        measured yet. `PRODUCT.md` was authored from this file's existing context plus
        one confirmed answer (real-SaaS tone, not portfolio-demo tone).
      - **Dashboard:** moved to `app/dashboard/page.tsx`, gated by
        `app/dashboard/layout.tsx`. All API calls (`lib/api.ts`, `useDashboardData`,
        `SettingsPanel`) now thread a Clerk session token (`useAuth().getToken()`) as a
        `Bearer` header — backend rejects unauthenticated requests.
      - **Sign-in/sign-up:** custom-themed via `lib/clerkAppearance.ts` (maps Clerk's
        `appearance` API to this app's own CSS custom properties, so the widget matches
        light/dark automatically) inside `components/landing/AuthShell.tsx` (branded
        split panel, consistent with the landing hero).
      - **Verified this session:** `npm run build` clean (no type errors), `eslint`
        clean on every new file (two pre-existing lint findings in
        `ModelBreakdown.tsx`/`SettingsPanel.tsx` are untouched, not introduced here),
        backend boots clean and Firestore-verified live, `impeccable detect` clean on
        all new UI files. Full click-through done via the `browse` headless-browser
        skill (no Chrome extension connection this session): landing hero renders and
        animates, `/dashboard` correctly 307-redirects to `/sign-in?redirect_url=...`
        when signed out, sign-up page renders Clerk's form fully re-themed, mobile
        viewport (390px) checked section by section. **Not yet tested with a real
        signed-in click-through** (sign up → see dashboard populate with real Firestore
        data) — next session, create a real test account and confirm end to end,
        including adding a real provider key and running actual queries per the
        pre-existing "Results" TODO below.

## Explicitly out of scope (don't suggest adding these)
- Permission-aware / role-based retrieval filtering *within* a tenant's own data (that's
  project 2 — different from the account-level multi-tenancy now built here)
- Knowledge graph / multi-hop retrieval (that's project 3)
- Production deployment infra (CI/CD, hosting, custom domains) — local dev with real
  Clerk/Firebase accounts for now; deployment is a separate decision when asked for
- Billing/subscription tiers — not asked for yet; don't add Stripe or pricing logic
  speculatively just because "SaaS" was said
