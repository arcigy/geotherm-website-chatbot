# Provider Resilience Audit

Generated: 2026-06-02T19:17:23.900Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 3884 ms
- max response time: 4197 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3401 ms
- services_overview: 3/3, max 2425 ms
- vague_heat_pump_followup: 3/3, max 2409 ms
- old_house_radiators_verdict: 3/3, max 2387 ms
- new_build_closure_models_cta: 3/3, max 4197 ms
- third_party_service_cautious: 3/3, max 2309 ms
- buffer_tank_price_scope: 3/3, max 2257 ms
- plan_obnovy_subsidy: 3/3, max 2317 ms
- photovoltaics_heat_pump: 3/3, max 2845 ms
- mss_solar: 3/3, max 2340 ms
- garden_frost_free_valve: 3/3, max 2438 ms
- air_conditioning_plural: 3/3, max 2407 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3401 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2425 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2053 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2387 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3551 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2309 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2257 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2179 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2845 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2292 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2257 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2407 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2777 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2309 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2409 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2202 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 3884 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2252 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2129 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2292 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2172 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 1977 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2011 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2265 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2508 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2183 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2099 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2329 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 4197 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2259 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 1926 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2317 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2506 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2340 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2438 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2162 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
