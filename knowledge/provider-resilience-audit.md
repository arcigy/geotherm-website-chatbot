# Provider Resilience Audit

Generated: 2026-06-02T20:05:49.890Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 3551 ms
- max response time: 4105 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 2994 ms
- services_overview: 3/3, max 2421 ms
- vague_heat_pump_followup: 3/3, max 2862 ms
- old_house_radiators_verdict: 3/3, max 2719 ms
- new_build_closure_models_cta: 3/3, max 4105 ms
- third_party_service_cautious: 3/3, max 2382 ms
- buffer_tank_price_scope: 3/3, max 3180 ms
- plan_obnovy_subsidy: 3/3, max 2621 ms
- photovoltaics_heat_pump: 3/3, max 2880 ms
- mss_solar: 3/3, max 2540 ms
- garden_frost_free_valve: 3/3, max 2328 ms
- air_conditioning_plural: 3/3, max 2391 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 2994 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2386 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2213 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2537 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3551 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2130 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 3180 | yes | price_answer | unknown | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2471 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2515 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2499 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2328 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2377 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2527 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2250 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2353 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2719 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 4105 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2382 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2098 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2487 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2811 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2540 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2255 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2391 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2207 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2421 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2862 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2522 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 3430 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2297 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2246 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2621 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2880 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2123 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2183 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2330 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
