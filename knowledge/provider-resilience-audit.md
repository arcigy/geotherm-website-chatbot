# Provider Resilience Audit

Generated: 2026-06-02T15:37:23.225Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 3034 ms
- max response time: 4540 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 2975 ms
- services_overview: 3/3, max 2622 ms
- vague_heat_pump_followup: 3/3, max 2392 ms
- old_house_radiators_verdict: 3/3, max 2526 ms
- new_build_closure_models_cta: 3/3, max 4540 ms
- third_party_service_cautious: 3/3, max 2378 ms
- buffer_tank_price_scope: 3/3, max 2322 ms
- plan_obnovy_subsidy: 3/3, max 2305 ms
- photovoltaics_heat_pump: 3/3, max 2786 ms
- mss_solar: 3/3, max 2750 ms
- garden_frost_free_valve: 3/3, max 2515 ms
- air_conditioning_plural: 3/3, max 2439 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 2975 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2622 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2083 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2430 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3034 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2378 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 1972 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2048 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2535 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2389 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2233 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2158 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2501 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2453 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2206 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2526 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 4540 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 1976 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2131 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2192 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2511 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2750 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2515 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2439 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2642 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2145 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2392 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2286 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 3032 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2193 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2322 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2305 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2786 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2509 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2405 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2391 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
