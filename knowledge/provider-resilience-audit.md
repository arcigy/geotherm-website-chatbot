# Provider Resilience Audit

Generated: 2026-06-02T15:52:44.661Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 5407 ms
- max response time: 5445 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3394 ms
- services_overview: 3/3, max 5445 ms
- vague_heat_pump_followup: 3/3, max 5407 ms
- old_house_radiators_verdict: 3/3, max 2779 ms
- new_build_closure_models_cta: 3/3, max 4062 ms
- third_party_service_cautious: 3/3, max 2699 ms
- buffer_tank_price_scope: 3/3, max 2574 ms
- plan_obnovy_subsidy: 3/3, max 2862 ms
- photovoltaics_heat_pump: 3/3, max 4970 ms
- mss_solar: 3/3, max 2448 ms
- garden_frost_free_valve: 3/3, max 2509 ms
- air_conditioning_plural: 3/3, max 2651 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3281 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2652 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 5407 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2779 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 4062 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2088 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2329 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2414 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2450 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2298 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2509 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2178 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2642 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 5445 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2051 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2477 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 3608 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2474 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2358 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2862 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 4970 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2448 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2330 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2488 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 3394 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2444 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2093 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2468 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 3834 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2699 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2574 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2402 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2740 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2201 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 1949 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2651 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
