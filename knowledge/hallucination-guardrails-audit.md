# Hallucination Guardrails Audit

Generated: 2026-06-03T16:48:59.217Z
Cases: 11
Passed: 11
Failed: 0
Max response time: 8000 ms
Verdict: PASS

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| daikin_heat_pump_portfolio | yes | 3942 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| mitsubishi_heat_pump_portfolio | yes | 2218 | yes | direct_answer | heat_pump | brand_model | 3 |  |
| f2040_obsolete | yes | 3183 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| f2050_unconfirmed | yes | 2376 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| exact_price_guardrail | yes | 2345 | yes | price_answer | heat_pump | price | 3 |  |
| buffer_tank_in_price | yes | 2375 | yes | price_answer | heat_pump | price | 3 |  |
| free_inspection_claim | yes | 2388 | yes | direct_answer | unknown | inspection | 3 |  |
| subsidy_guarantee | yes | 2966 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| third_party_service | yes | 2327 | yes | direct_answer | service | service_fault | 3 |  |
| service_area_claim | yes | 2103 | yes | direct_answer | unknown | location | 3 |  |
| meeting_cta_after_guardrail | yes | 3939 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |

## Failed Answer Samples

