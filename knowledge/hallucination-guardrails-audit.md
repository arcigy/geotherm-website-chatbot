# Hallucination Guardrails Audit

Generated: 2026-06-03T22:41:29.325Z
Cases: 11
Passed: 11
Failed: 0
Max response time: 8000 ms
Verdict: PASS

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| daikin_heat_pump_portfolio | yes | 2173 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| mitsubishi_heat_pump_portfolio | yes | 2251 | yes | price_answer | heat_pump | price | 3 |  |
| f2040_obsolete | yes | 2451 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| f2050_unconfirmed | yes | 2004 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| exact_price_guardrail | yes | 2446 | yes | price_answer | heat_pump | price | 3 |  |
| buffer_tank_in_price | yes | 2003 | yes | price_answer | heat_pump | price | 3 |  |
| free_inspection_claim | yes | 2096 | yes | direct_answer | company | inspection | 3 |  |
| subsidy_guarantee | yes | 2110 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| third_party_service | yes | 1944 | yes | direct_answer | service | service_fault | 3 |  |
| service_area_claim | yes | 2025 | yes | direct_answer | company | location | 3 |  |
| meeting_cta_after_guardrail | yes | 3562 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |

## Failed Answer Samples

