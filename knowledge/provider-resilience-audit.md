# Provider Resilience Audit

Generated: 2026-06-02T15:22:54.128Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 4000 ms
- max response time: 4627 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3294 ms
- services_overview: 3/3, max 2332 ms
- vague_heat_pump_followup: 3/3, max 2175 ms
- old_house_radiators_verdict: 3/3, max 2823 ms
- new_build_closure_models_cta: 3/3, max 4627 ms
- third_party_service_cautious: 3/3, max 2463 ms
- buffer_tank_price_scope: 3/3, max 2315 ms
- plan_obnovy_subsidy: 3/3, max 2614 ms
- photovoltaics_heat_pump: 3/3, max 2712 ms
- mss_solar: 3/3, max 2432 ms
- garden_frost_free_valve: 3/3, max 2641 ms
- air_conditioning_plural: 3/3, max 2457 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3294 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2122 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2175 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2499 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 4000 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2134 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 1917 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2462 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2712 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2376 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2386 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2274 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2677 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2271 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2105 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2612 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 2871 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2169 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 1999 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2342 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2374 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2432 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2509 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2271 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2212 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2332 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2107 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2823 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 4627 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2463 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2315 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2614 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2498 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2265 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2641 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2457 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
