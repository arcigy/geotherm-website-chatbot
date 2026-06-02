# Geotherm Chatbot Goal Gap Audit

Generated: 2026-06-02
Current evidence source: local worktree after the latest audit run. Live API still needs restart/health verification after the next commit and push.

## Scope

This audit maps the active user goal to current evidence. It does not mark the goal complete; it identifies what is proven by current tests and what still needs stronger evidence.

## Current Evidence

| Area | Evidence | Status |
| --- | --- | --- |
| Live API is current | Last verified live `/health` before this audit returned `ok=true`, commit `683a88a`, flow `diagnostic-v5-recommendation-closure`; needs re-check after the next commit | Proven before current local changes |
| Broad service coverage | `knowledge/broad-surface-audit.md`: `59/59`, max 8000 ms, all LLM yes | Proven for covered broad cases |
| Live question coverage | `knowledge/live-question-surface-audit.md`: `102/102`, max 8000 ms, all LLM yes | Proven for covered live cases |
| WordPress REST surface coverage | `knowledge/wordpress-surface-audit.md`: `94/94` from 312 exported WordPress items | Proven for generated sampled cases |
| WordPress paraphrase/fuzz coverage | `knowledge/paraphrase-surface-audit.md`: `282/282`, 94 WordPress-derived topics x 3 customer wording variants, max 8000 ms, LLM required | Proven for covered paraphrases |
| Non-heat-pump long flows | `knowledge/non-heat-pump-flow-audit.md`: `27/27` across air conditioning, heat recovery, floor heating, ceiling cooling, service, subsidy, complex solution, water softener and central vacuum flows | Proven for covered non-heat-pump multi-turn flows |
| Adversarial long flows | `knowledge/adversarial-long-flow-audit.md`: `23/23`, covers service switching, correction turns, pricing/akumulačka, contact-only lead capture, out-of-scope return and less common products; all LLM yes, max 8000 ms | Proven for covered adversarial flows |
| Production readiness gates | `knowledge/production-readiness-audit.md`: `18/18`, production gates green | Proven for scripted gates |
| Provider resilience repeated runs | `knowledge/provider-resilience-audit.md`: `36/36`, 12 critical scenarios x 3 repeats, `llmUsed=false: 0`, over 8000 ms: 0 | Proven for covered repeated-run cases |
| Diagnostic conversations | `knowledge/diagnostic-conversation-test-report.md`: `44/44` | Proven for scripted conversation flows |
| API behavior | `knowledge/chat-api-test-report.md`: `7/7` | Proven for API tests |
| Router behavior | `knowledge/router-test-report.md`: `57/57` | Proven for router tests |
| CRM lead capture | `npm run test:crm-leads`: PASS, 10 turns | Proven by command output |
| CTA / handoff coverage | `knowledge/cta-coverage-audit.md`: `12/12`, all LLM yes, max 8000 ms | Proven for covered service handoff cases |
| Small talk without RAG | production readiness and provider resilience small-talk cases show `sources=0`, `llm=yes`, `general_chat`, compact non-RAG answer | Proven for covered small-talk cases |
| Every covered answer goes through AI | audits above require `llmUsed=true`; latest covered runs are green | Proven for covered cases |
| Response under 8 seconds | audits above enforce max 8000 ms | Proven for covered cases |

## Remaining Gaps

| Requirement | Gap |
| --- | --- |
| "Extremely many questions / every possible customer nonsense" | Current audits cover broad, live, generated WordPress samples, 282 WordPress paraphrases and 23 adversarial long-flow turns, but no finite test proves every possible phrasing. More randomized monitoring would strengthen this. |
| "No hallucination at all" | Validators and banned-claim checks cover known risks, but zero hallucination cannot be proven globally. Needs continuous adversarial tests and review of new failure transcripts. |
| "Always asks follow-up when vague, but stops after a few turns" | Diagnostic, non-heat-pump and adversarial long-flow tests cover key flows, corrections and topic switches. Global behavior still needs ongoing monitoring because arbitrary conversations are unbounded. |
| "Always routes toward meeting/Geotherm consultation" | Dedicated CTA audit and adversarial long-flow coverage now cover key service handoffs, including explicit meeting requests. Global "always" still needs wider live monitoring. |
| "Work in duplicate, do not change main" | Not satisfied literally because repository instruction requires staying on `main` and pushing final changes. Current work followed the higher-priority repo instruction. |
| "Full production readiness" | Current production and provider resilience audits are green, but production readiness is not a one-time proof. It still needs continued live monitoring under real traffic and more adversarial long-flow tests. |

## Next Recommended Work

1. Add scheduled/live monitoring for provider resilience over time, not only one local repeated-run batch.
2. Keep expanding concrete company-truth chunks when new customer transcripts expose missing services, models, price rules or policies.
3. Add more randomized paraphrase generation for long-flow scenarios, especially service switching and price/contact closure.
