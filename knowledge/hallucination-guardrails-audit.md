# Hallucination Guardrails Audit

Generated: 2026-06-02T20:14:34.734Z
Cases: 11
Passed: 11
Failed: 0
Max response time: 8000 ms
Verdict: PASS

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| daikin_heat_pump_portfolio | yes | 2619 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| mitsubishi_heat_pump_portfolio | yes | 2657 | yes | direct_answer | heat_pump | process | 3 |  |
| f2040_obsolete | yes | 2320 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| f2050_unconfirmed | yes | 2400 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| exact_price_guardrail | yes | 2754 | yes | price_answer | heat_pump | price | 3 |  |
| buffer_tank_in_price | yes | 2446 | yes | price_answer | heat_pump | price | 3 |  |
| free_inspection_claim | yes | 2539 | yes | direct_answer | service | inspection | 3 |  |
| subsidy_guarantee | yes | 2513 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| third_party_service | yes | 2267 | yes | direct_answer | service | service_fault | 3 |  |
| service_area_claim | yes | 2503 | yes | direct_answer | unknown | location | 3 |  |
| meeting_cta_after_guardrail | yes | 3241 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |

## Failed Answer Samples

