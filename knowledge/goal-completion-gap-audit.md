# Geotherm Chatbot Goal Gap Audit

Generated: 2026-06-03T15:40:37.754Z
Audit base commit: 467f961

## Evidence Gates

Passed: 17/17
Verdict: EVIDENCE PASS

| Gate | Pass | Evidence | Scope |
| --- | --- | --- | --- |
| production_readiness | yes | ## Summary | Production gates, health, monitoring fields, auth/rate-limit gates and response-time budget. |
| broad_surface | yes | ## Summary | Broad service/product surface across Geotherm topics. |
| live_questions | yes | Passed: 102 | Live/customer-style question list. |
| wordpress_surface | yes | ## Summary | Generated checks from exported WordPress content. |
| wordpress_paraphrases | yes | ## Summary | WordPress-derived paraphrases and customer wording variants. |
| non_heat_pump_flows | yes | Passed turns: 27 | Multi-turn flows for services beyond heat pumps. |
| adversarial_long_flows | yes | Passed turns: 40 | Corrections, topic switching, price/contact closure and adversarial turns. |
| provider_resilience | yes | ## Summary | Repeated critical scenarios require LLM usage and under-8s responses. |
| diagnostic_conversation | yes | Verdict: PASS | Scripted recommendation, direct-answer, correction, price and CRM conversation flows. |
| chat_api | yes | ## Summary | API contract and debug surface. |
| router | yes | ## Summary | Service and intent routing. |
| cta_coverage | yes | Passed: 12 | Meeting, consultation and handoff CTA behavior. |
| small_talk | yes | Passed: 14 | Small talk uses AI but avoids unnecessary RAG. |
| hallucination_guardrails | yes | Passed: 11 | Known banned claims, unsupported facts and safety constraints. |
| sales_feedback | yes | Passed: 18 | Salesperson feedback: vykanie, appointments, large objects, contact capture. |
| sales_flow | yes | ## Summary | Sales flow behavior from first advisory question through soft handoff and lead capture. |
| operational_guardrails | yes | Passed: 30 | Operational safety, persistence and policy guardrails. |

## Proven By Current Evidence

- Covered small talk goes through AI and avoids RAG when sources are not needed.
- Covered vague questions receive direction plus follow-up questions.
- Covered multi-turn flows stop asking after a few turns and move to recommendation, consultation or nacenenie.
- Covered Geotherm services beyond heat pumps route through service-specific RAG and guardrails.
- Covered price, model, subsidy, appointment and lead-capture risks are guarded against known hallucinations.
- Covered response-time gates enforce an 8000 ms maximum.

## Remaining Gaps

- No finite local audit can prove every possible customer phrasing or zero hallucination globally.
- New WordPress content, product changes, price rules, subsidies and service policy changes still need fresh RAG chunks and reruns.
- Production readiness remains a monitoring discipline: live traffic should keep feeding new transcripts into these audits.
- The user request to work in a duplicate instead of main conflicts with repository instructions that say to keep working on main and not create branches.

## Next Work

1. Add new failing customer transcripts to a concrete audit before changing behavior.
2. Expand company-truth chunks only when a real missing fact is identified.
3. Rerun this audit after the full test/audit suite to keep completion evidence current.
