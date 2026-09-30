# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, TypeScript), Tailwind CSS, Framer Motion, GSAP. Backend: Python
FastAPI (sibling directory, not this project root), Clerk for auth, Firebase Firestore
for storage. Already in place — not a greenfield stack decision.

## Users

Developers and small teams building RAG/LLM-backed products who want to cut LLM spend and
p95 latency without giving up answer quality. They bring their own provider API key
(Anthropic and/or OpenAI) and use this as a caching + routing layer in front of their
existing LLM calls.

## Product Purpose

A hosted service that (1) caches answers by embedding similarity so repeated or
near-duplicate questions skip the LLM entirely, and (2) routes each query to a small or
large model based on estimated difficulty — tracking cost and latency per request on a
live dashboard. Success: a user sees their real cache-hit rate, cost saved, and latency
improvement reflected honestly in the dashboard after running real traffic through it.

## Positioning

Semantic caching + a cheap, pre-call difficulty heuristic (not an LLM-based router, which
would erase its own savings) + multi-provider support in one account, with the user's own
encrypted API key. The combination — not any single piece — is the pitch.

## Operating Context

User signs up (Clerk), adds a provider API key in Settings (encrypted at rest, never
returned in plaintext by any endpoint), and sends queries to `POST /query`. Every
request, cache hit or miss, is logged per-account in Firestore and rolled up into the
`/dashboard` stats view (hit rate, cost saved, latency, model breakdown, live query feed).

## Capabilities and Constraints

- Multi-tenant: every read/write is scoped to the Clerk-verified user id server-side;
  no endpoint trusts a user id from the request body.
- Multi-provider: Anthropic and OpenAI today, extensible via `PROVIDERS` in
  `app/providers.py`.
- No vector DB, no Redis — brute-force cosine similarity at this scale, by design.
- Billing/subscription tiers: explicitly not built yet — landing page must not imply
  pricing or a paid tier exists.
- Real usage numbers (hit rate %, cost saved, latency delta) are not yet measured end to
  end with a real provider key — landing page copy must not state specific benchmark
  numbers as fact; frame capability, not a measured result, until `README.md`'s Results
  section is filled in.

## Brand Commitments

No existing name/logo beyond "Semantic Caching & Cost-Aware Router" / working dashboard
title "Cache & Routing Analytics". No prior brand identity to preserve — first real
landing page for this product.

## Evidence on Hand

No customer testimonials, logos, or case studies — none should be fabricated. The only
real evidence is the mechanism itself (cache lookup, routing heuristic, cost tracking)
and the live dashboard once a user has real traffic flowing.

## Product Principles

- Bring-your-own-key: the user's provider spend is their own; this product's job is to
  reduce how much of it gets spent, not to resell LLM access.
- Honesty over hype: no fabricated benchmark numbers, testimonials, or "trusted by"
  logos — this is a real product with not-yet-measured production numbers.
- The router's cost advantage depends on the routing decision itself being cheap — this
  is a structural claim worth making confidently in copy.
- Security is a feature, not an afterthought: encrypted keys, masked display, per-tenant
  isolation are all real and can be stated as fact.

## Accessibility & Inclusion

No product-specific accessibility requirement established beyond standard web a11y
(keyboard navigation, contrast, screen-reader-friendly auth flows via Clerk's own
components).
