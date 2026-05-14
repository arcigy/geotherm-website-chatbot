# Scoreboard V2

Generated: 2026-05-08

## Scores

| Area | Score | Reason |
| --- | ---: | --- |
| Retrieval baseline | 84/100 | Baseline retrieval remains PASS and massive evaluation is now 184/200 PASS with 0 FAIL. Safety-sensitive queries bypass retrieval instead of relying on chunk ranking. |
| Widget embed | 70/100 | Local E2E and API integration work. Production CDN/versioning/config governance still missing. |
| API maturity | 66/100 | `/chat` now has a pre-retrieval safety router, sessions, events, retrieval, lead-safe advisory flow and confidence policy. Still no formal API schema or production auth/rate limit. |
| Security | 39/100 | Safety router reduces unsafe technical guidance and guarantee risk. Still no signed site keys, no abuse throttling and no production WAF/rate limits. |
| Observability | 47/100 | `safety_router_triggered` is logged and reports are stronger. Still no live traces, dashboards, alerts or incident workflow. |
| Lead conversion | 62/100 | Non-pushy lead flow remains intact. Safety router avoids aggressive contact capture. No CRM/email/booking/human handoff. |
| Ingestion | 40/100 | Boilerplate risk is penalized and reports flag contradiction/freshness risks. Still no scheduled sync or approval workflow. |
| Deployment readiness | 28/100 | Local-only. No production infra, migrations, CI deploy, secrets or rollback plan. |
| Maintainability | 58/100 | Reliability logic is stronger but policy/routing rules are growing inside the server and should be separated before production. |
| Business readiness | 52/100 | Safer advisory sales intake MVP. Still missing operator workflow, CRM handoff and client reporting. |

## Production Readiness Score

**53/100**

The system is materially safer after the safety router. It is still not production-grade: the core risks moved from hallucination/unsafe technical advice toward operations, monitoring, deployment, source governance and human handoff.

## Safety Router Update

- Safety-sensitive massive category: 10/10 PASS, 0 FAIL.
- Massive evaluation: 184 PASS / 16 WARN / 0 FAIL, 92% pass rate.
- Hallucination incidents: 0.
- Overconfidence incidents: 0.
- Retrieval drift incidents: 0.
- Hard RAG: PASS, 28 PASS / 4 WARN / 0 FAIL.
- Long conversation: 0 FAIL, 16 WARN from repetitive fallback UX.

## Remaining Production Blockers

1. Repetitive fallback behavior in long sessions.
2. Some noisy/slang and unsupported claims still degrade to WARN.
3. Safety/policy logic needs to move out of `chat-server.ts` into a dedicated policy module.
4. No live monitoring or abuse controls.
5. No production deployment, CRM handoff or operator workflow.

