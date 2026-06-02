# Provider Resilience Audit

Generated: 2026-06-02T17:54:50.584Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 3382 ms
- max response time: 3861 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 2994 ms
- services_overview: 3/3, max 3186 ms
- vague_heat_pump_followup: 3/3, max 2294 ms
- old_house_radiators_verdict: 3/3, max 2449 ms
- new_build_closure_models_cta: 3/3, max 3861 ms
- third_party_service_cautious: 3/3, max 2394 ms
- buffer_tank_price_scope: 3/3, max 2423 ms
- plan_obnovy_subsidy: 3/3, max 2560 ms
- photovoltaics_heat_pump: 3/3, max 2972 ms
- mss_solar: 3/3, max 2298 ms
- garden_frost_free_valve: 3/3, max 2448 ms
- air_conditioning_plural: 3/3, max 2260 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 2994 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2122 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2138 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2449 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3255 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2071 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 1853 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2388 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2972 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2298 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2448 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2247 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2434 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2160 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2294 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2430 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 3861 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2394 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2423 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2370 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2536 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 1936 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2208 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2260 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2413 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 3186 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2208 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2348 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 3382 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 1829 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2106 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2560 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2343 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2174 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2429 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2152 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
