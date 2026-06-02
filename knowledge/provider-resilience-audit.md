# Provider Resilience Audit

Generated: 2026-06-02T15:10:07.853Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 4672 ms
- max response time: 4861 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 2961 ms
- services_overview: 3/3, max 2499 ms
- vague_heat_pump_followup: 3/3, max 2328 ms
- old_house_radiators_verdict: 3/3, max 2479 ms
- new_build_closure_models_cta: 3/3, max 4672 ms
- third_party_service_cautious: 3/3, max 2615 ms
- buffer_tank_price_scope: 3/3, max 2414 ms
- plan_obnovy_subsidy: 3/3, max 2611 ms
- photovoltaics_heat_pump: 3/3, max 2843 ms
- mss_solar: 3/3, max 2713 ms
- garden_frost_free_valve: 3/3, max 4861 ms
- air_conditioning_plural: 3/3, max 4062 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 2495 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2334 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2037 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 1879 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 4278 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2422 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2148 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2611 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2843 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2713 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 4861 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 4062 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2933 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2499 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2033 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2479 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 4288 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2615 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2414 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2530 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2823 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 1976 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2344 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2323 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2961 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2412 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2328 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2408 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 4672 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2209 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2112 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2575 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2782 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2407 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2376 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 1777 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
