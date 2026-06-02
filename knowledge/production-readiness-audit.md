# Production Readiness Audit

Generated: 2026-06-02T15:50:26.235Z
Max response time: 8000 ms

## Summary

- scenarios: 17
- passed: 17
- failed: 0
- production gates: 6/6
- health endpoint: PASS
- total checks: 24/24
- verdict: PASS

## Production Gates

| Gate | Pass | Evidence |
| --- | --- | --- |
| runtime_monitoring | yes | Requires /health, commit, diagnostic flow, response time, LLM usage, validators and persistence debug fields. |
| human_escalation | yes | Requires outreach table, outreach creation, admin outreach endpoint and CRM test coverage. |
| source_freshness | yes | Requires contradiction audit for time-sensitive/price/subsidy risks and semantic coverage with no weak topics. |
| answer_quality_debug | yes | Requires direct/closure gates, enriched retrieval query, stored slots and source count in debug output. |
| abuse_controls | yes | Requires enforced /chat rate limiting, 429 rate_limited errors, Retry-After and security self-check coverage. |
| signed_site_auth | yes | Requires optional HMAC signed /chat requests, invalid signature rejection and security self-check coverage. |
| health_endpoint | yes | Local /health returned ok with commit and diagnosticFlowVersion. |

## Cases

| Scenario | Pass | ms | LLM used | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_greeting | yes | 2099 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 2089 | yes | general_chat | unknown | general | 0 |  |
| vague_heat_pump_followup | yes | 2159 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | yes | 2627 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_cta | yes | 5111 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| brands_safe | yes | 1948 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| daikin_correction | yes | 2039 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| price_scope | yes | 2397 | yes | price_answer | heat_pump | price | 3 |  |
| buffer_tank_scope | yes | 2314 | yes | price_answer | heat_pump | price | 3 |  |
| obsolete_f2040 | yes | 4325 | yes | correction_answer | heat_pump | complaint_or_correction | 3 |  |
| unconfirmed_f2050 | yes | 2205 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| air_conditioning | yes | 2452 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| heat_recovery | yes | 2571 | yes | rag_answer | heat_recovery | recommendation | 3 |  |
| floor_heating | yes | 2282 | yes | direct_answer | floor_heating | process | 3 |  |
| ceiling_cooling | yes | 2204 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| service_fault | yes | 2396 | yes | direct_answer | service | service_fault | 3 |  |
| subsidy | yes | 3004 | yes | direct_answer | subsidy | subsidy | 3 |  |

## Sample Failed Answers
