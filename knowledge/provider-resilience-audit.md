# Provider Resilience Audit

Generated: 2026-06-02T16:16:40.115Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 4826 ms
- max response time: 6149 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3489 ms
- services_overview: 3/3, max 2549 ms
- vague_heat_pump_followup: 3/3, max 2762 ms
- old_house_radiators_verdict: 3/3, max 4826 ms
- new_build_closure_models_cta: 3/3, max 6149 ms
- third_party_service_cautious: 3/3, max 2631 ms
- buffer_tank_price_scope: 3/3, max 2246 ms
- plan_obnovy_subsidy: 3/3, max 2681 ms
- photovoltaics_heat_pump: 3/3, max 3076 ms
- mss_solar: 3/3, max 2764 ms
- garden_frost_free_valve: 3/3, max 2382 ms
- air_conditioning_plural: 3/3, max 2647 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3404 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2421 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2158 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2229 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 6149 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2192 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2246 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2681 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 3076 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2322 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2255 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2647 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 3489 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2549 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2762 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2560 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 4401 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2631 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2197 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2580 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 3034 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2506 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2272 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2459 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2837 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2094 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2503 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 4826 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 4019 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2496 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2164 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2269 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2658 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2764 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2382 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2587 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
