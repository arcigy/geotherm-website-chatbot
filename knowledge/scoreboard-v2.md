# Scoreboard V2

Generated: 2026-05-07

## Scores

| Area | Score | Reason |
| --- | ---: | --- |
| Retrieval baseline | 72/100 | Local lexical retrieval is tested and good enough as a baseline, but still no embeddings/reranker. |
| Widget embed | 70/100 | Local E2E passes and API integration works. Production config/CDN/versioning is still weak. |
| API maturity | 58/100 | `/chat` now has sessions, conversations, messages, events, leads and a less pushy advisory state machine. Still not framework-grade or production hardened. |
| Security | 32/100 | Body limits, siteId validation and structured errors exist. No signed site key, no rate limit, no auth. |
| Observability | 42/100 | Events and CLI analytics exist. No real logs, traces, Sentry, dashboards or alerts. |
| Lead conversion | 62/100 | Lead capture now waits for explicit contact or contact consent, and the bot asks advisory follow-ups first. No CRM/email/booking/human handoff. |
| Ingestion | 38/100 | Knowledge pipeline exists locally. No scheduled sync, approval workflow or versioned publishing process beyond seed metadata. |
| Deployment readiness | 28/100 | Local services work. No production infra, migrations, CI deploy, secrets or rollback plan. |
| Maintainability | 52/100 | Code is modular enough for MVP, but scripts are growing into backend architecture without framework boundaries. |
| Business readiness | 48/100 | System now captures leads locally. Still no client-facing ops, reporting, SLA, CRM or delivery workflow. |

## Production Readiness Score

**46/100**

This phase materially improved the system from a knowledge chatbot demo to a local AI sales intake MVP. The latest behavior pass made the sales flow less aggressive and more advisor-like. It is still not production-ready. The biggest remaining blockers are security, rate limiting, CRM/email handoff, admin operations, and production deployment discipline.

## Brutal Notes

- The lead database is local and unencrypted.
- The sales flow is deterministic and less pushy now, but still brittle.
- Analytics are static CLI reports, not operational monitoring.
- A real client would still need manual lead extraction unless someone runs CLI commands.
- This is now a more credible advisory sales intake MVP, not a SaaS platform.

## Next Production Gate

Do not add LLM polish before:

1. Signed site keys.
2. Rate limiting.
3. Postgres migration path.
4. CRM/email handoff.
5. Operator-facing lead review workflow.
