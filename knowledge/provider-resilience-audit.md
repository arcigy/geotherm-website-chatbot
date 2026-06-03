# Provider Resilience Audit

Generated: 2026-06-03T10:29:01.360Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 3747 ms
- max response time: 3963 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3601 ms
- services_overview: 3/3, max 2936 ms
- vague_heat_pump_followup: 3/3, max 2297 ms
- old_house_radiators_verdict: 3/3, max 2425 ms
- new_build_closure_models_cta: 3/3, max 3963 ms
- third_party_service_cautious: 3/3, max 2572 ms
- buffer_tank_price_scope: 3/3, max 2486 ms
- plan_obnovy_subsidy: 3/3, max 2609 ms
- photovoltaics_heat_pump: 3/3, max 2675 ms
- mss_solar: 3/3, max 2490 ms
- garden_frost_free_valve: 3/3, max 2267 ms
- air_conditioning_plural: 3/3, max 2346 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3071 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2936 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2297 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2231 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3963 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2265 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2205 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2137 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2451 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2188 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2153 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 1995 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 3601 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2262 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2036 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2425 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 3257 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2572 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2486 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2609 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2675 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2490 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2072 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2116 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2772 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2244 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2114 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 1913 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 3747 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2349 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 1923 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2407 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2597 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2358 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2267 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2346 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
