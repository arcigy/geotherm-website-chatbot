# Provider Resilience Audit

Generated: 2026-06-02T15:43:46.120Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 3619 ms
- max response time: 3786 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 2808 ms
- services_overview: 3/3, max 2436 ms
- vague_heat_pump_followup: 3/3, max 2539 ms
- old_house_radiators_verdict: 3/3, max 2576 ms
- new_build_closure_models_cta: 3/3, max 3786 ms
- third_party_service_cautious: 3/3, max 3400 ms
- buffer_tank_price_scope: 3/3, max 2457 ms
- plan_obnovy_subsidy: 3/3, max 2724 ms
- photovoltaics_heat_pump: 3/3, max 2732 ms
- mss_solar: 3/3, max 2414 ms
- garden_frost_free_valve: 3/3, max 2506 ms
- air_conditioning_plural: 3/3, max 2640 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 2808 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2436 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2238 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2533 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3303 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2152 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2457 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2473 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2639 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2311 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2417 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2640 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2500 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2116 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2080 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2548 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 3619 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2471 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 1958 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2724 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2652 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2414 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2506 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2449 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2754 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2391 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2539 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2576 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 3786 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 3400 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2276 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2571 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2732 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2083 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2101 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2407 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
