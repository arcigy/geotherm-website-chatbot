# Provider Resilience Audit

Generated: 2026-06-02T15:31:43.997Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 3571 ms
- max response time: 3860 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3075 ms
- services_overview: 3/3, max 2567 ms
- vague_heat_pump_followup: 3/3, max 2183 ms
- old_house_radiators_verdict: 3/3, max 2578 ms
- new_build_closure_models_cta: 3/3, max 3860 ms
- third_party_service_cautious: 3/3, max 2335 ms
- buffer_tank_price_scope: 3/3, max 2160 ms
- plan_obnovy_subsidy: 3/3, max 2826 ms
- photovoltaics_heat_pump: 3/3, max 2707 ms
- mss_solar: 3/3, max 2536 ms
- garden_frost_free_valve: 3/3, max 2494 ms
- air_conditioning_plural: 3/3, max 2294 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3075 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2215 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2031 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2262 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3571 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2287 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2040 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2826 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 1957 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 1977 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2494 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2294 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2713 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2223 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 1949 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2578 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 3254 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2225 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2160 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2471 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2707 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2352 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2324 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2287 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 3003 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2567 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2183 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2306 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 3860 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2335 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 1755 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2490 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2309 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2536 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2173 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2176 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
