# Hallucination Guardrails Audit

Generated: 2026-06-03T08:57:39.041Z
Cases: 11
Passed: 11
Failed: 0
Max response time: 8000 ms
Verdict: PASS

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| daikin_heat_pump_portfolio | yes | 4191 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| mitsubishi_heat_pump_portfolio | yes | 3228 | yes | direct_answer | heat_pump | process | 3 |  |
| f2040_obsolete | yes | 2392 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| f2050_unconfirmed | yes | 2205 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| exact_price_guardrail | yes | 2356 | yes | price_answer | heat_pump | price | 3 |  |
| buffer_tank_in_price | yes | 2095 | yes | price_answer | heat_pump | price | 3 |  |
| free_inspection_claim | yes | 1956 | yes | direct_answer | unknown | inspection | 3 |  |
| subsidy_guarantee | yes | 2473 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| third_party_service | yes | 2191 | yes | direct_answer | service | service_fault | 3 |  |
| service_area_claim | yes | 2135 | yes | direct_answer | unknown | location | 3 |  |
| meeting_cta_after_guardrail | yes | 4779 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |

## Failed Answer Samples

