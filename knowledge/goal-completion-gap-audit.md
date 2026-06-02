# Geotherm Chatbot Goal Gap Audit

Generated: 2026-06-02
Current evidence source: local worktree after the latest audit run. Live API still needs restart/health verification after commit and push.

## Scope

This audit maps the active user goal to current evidence. It does not mark the goal complete; it identifies what is proven by current tests and what still needs stronger evidence.

## Current Evidence

| Area | Evidence | Status |
| --- | --- | --- |
| Live API is current | `/health` returned `ok=true`, commit `6924a50`, flow `diagnostic-v5-recommendation-closure` | Proven |
| Broad service coverage | `knowledge/broad-surface-audit.md`: `58/58`, max 8000 ms, all LLM yes | Proven for covered broad cases |
| Live question coverage | `knowledge/live-question-surface-audit.md`: `102/102`, max 8000 ms, all LLM yes | Proven for covered live cases |
| WordPress REST surface coverage | `knowledge/wordpress-surface-audit.md`: `94/94` from 312 exported WordPress items | Proven for generated sampled cases |
| WordPress paraphrase/fuzz coverage | `knowledge/paraphrase-surface-audit.md`: `282/282`, 94 WordPress-derived topics x 3 customer wording variants, max 8000 ms, LLM required | Proven for covered paraphrases |
| Non-heat-pump long flows | `knowledge/non-heat-pump-flow-audit.md`: `27/27` across air conditioning, heat recovery, floor heating, ceiling cooling, service, subsidy, complex solution, water softener and central vacuum flows | Proven for covered non-heat-pump multi-turn flows |
| Production readiness gates | `knowledge/production-readiness-audit.md`: `17/17`, production gates `6/6`, health PASS | Proven for scripted gates |
| Diagnostic conversations | `knowledge/diagnostic-conversation-test-report.md`: `44/44` | Proven for scripted conversation flows |
| API behavior | `knowledge/chat-api-test-report.md`: `7/7` | Proven for API tests |
| Router behavior | `knowledge/router-test-report.md`: `57/57` | Proven for router tests |
| CRM lead capture | `npm run test:crm-leads`: PASS, 10 turns | Proven by command output |
| CTA / handoff coverage | `knowledge/cta-coverage-audit.md`: `12/12`, all LLM yes, max 8000 ms | Proven for covered service handoff cases |
| Small talk without RAG | production readiness small-talk cases show `sources=0`, `llm=yes`, `general_chat` | Proven for covered small-talk cases |
| Every covered answer goes through AI | audits above require `llmUsed=true`; latest covered runs are green | Proven for covered cases |
| Response under 8 seconds | audits above enforce max 8000 ms | Proven for covered cases |

## Remaining Gaps

| Requirement | Gap |
| --- | --- |
| "Extremely many questions / every possible customer nonsense" | Current audits cover broad, live, generated WordPress samples and 282 WordPress paraphrases, but no finite test proves every possible phrasing. More randomized/adversarial fuzzing would strengthen this. |
| "No hallucination at all" | Validators and banned-claim checks cover known risks, but zero hallucination cannot be proven globally. Needs continuous adversarial tests and review of new failure transcripts. |
| "Always asks follow-up when vague, but stops after a few turns" | Diagnostic and non-heat-pump multi-turn tests cover key flows, and paraphrase coverage reduces wording risk. Global behavior still needs more randomized long-flow testing. |
| "Always routes toward meeting/Geotherm consultation" | Dedicated CTA audit and paraphrase coverage now cover key service handoffs, but global "always" still needs wider randomized monitoring. |
| "Work in duplicate, do not change main" | Not satisfied literally because repository instruction requires staying on `main` and pushing final changes. Current work followed the higher-priority repo instruction. |
| "Full production readiness" | Current production audit is green, but production readiness is not a one-time proof. It needs repeated live monitoring under provider load because occasional Gemini high-demand events were observed during earlier runs. |

## Next Recommended Work

1. Add repeated-run provider resilience metrics: how often `llmUsed=false` or >8000 ms appears under Gemini load, even when a single audit pass is green.
2. Add randomized/adversarial long-flow tests that combine multiple services and vague follow-ups.
3. Keep expanding concrete company-truth chunks when new customer transcripts expose missing services, models, price rules or policies.
