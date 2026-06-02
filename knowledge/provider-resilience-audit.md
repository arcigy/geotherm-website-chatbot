# Provider Resilience Audit

Generated: 2026-06-02T15:48:27.137Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 4395 ms
- max response time: 4685 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 2955 ms
- services_overview: 3/3, max 2319 ms
- vague_heat_pump_followup: 3/3, max 2399 ms
- old_house_radiators_verdict: 3/3, max 2564 ms
- new_build_closure_models_cta: 3/3, max 4685 ms
- third_party_service_cautious: 3/3, max 2327 ms
- buffer_tank_price_scope: 3/3, max 2345 ms
- plan_obnovy_subsidy: 3/3, max 2681 ms
- photovoltaics_heat_pump: 3/3, max 2753 ms
- mss_solar: 3/3, max 2464 ms
- garden_frost_free_valve: 3/3, max 2429 ms
- air_conditioning_plural: 3/3, max 2440 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 2955 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2142 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2399 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2564 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 4685 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2089 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2345 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2681 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2249 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2464 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2053 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2185 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2669 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2319 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 1928 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2443 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 4395 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2327 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2300 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2285 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2753 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2329 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2284 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2440 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2611 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2209 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 1651 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2508 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 3491 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2241 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2230 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2476 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2497 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2236 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2429 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2180 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
