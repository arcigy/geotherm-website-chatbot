# Provider Resilience Audit

Generated: 2026-06-02T15:27:24.570Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 4244 ms
- max response time: 4637 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3260 ms
- services_overview: 3/3, max 2535 ms
- vague_heat_pump_followup: 3/3, max 2093 ms
- old_house_radiators_verdict: 3/3, max 2795 ms
- new_build_closure_models_cta: 3/3, max 4637 ms
- third_party_service_cautious: 3/3, max 2607 ms
- buffer_tank_price_scope: 3/3, max 2086 ms
- plan_obnovy_subsidy: 3/3, max 2748 ms
- photovoltaics_heat_pump: 3/3, max 2501 ms
- mss_solar: 3/3, max 2405 ms
- garden_frost_free_valve: 3/3, max 2487 ms
- air_conditioning_plural: 3/3, max 2509 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3260 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2535 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2093 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2795 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 4244 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2607 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2029 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2748 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2273 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2405 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2487 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2509 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2614 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2287 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 1773 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2230 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 4637 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2177 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2073 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2233 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2501 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2077 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2381 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2102 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2531 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2077 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 1999 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2205 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 4228 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2279 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2086 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2277 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2095 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 1834 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2210 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2125 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
