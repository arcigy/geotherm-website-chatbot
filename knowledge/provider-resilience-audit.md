# Provider Resilience Audit

Generated: 2026-06-02T15:01:05.807Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 4082 ms
- max response time: 4778 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3059 ms
- services_overview: 3/3, max 2493 ms
- vague_heat_pump_followup: 3/3, max 2069 ms
- old_house_radiators_verdict: 3/3, max 2577 ms
- new_build_closure_models_cta: 3/3, max 4778 ms
- third_party_service_cautious: 3/3, max 2510 ms
- buffer_tank_price_scope: 3/3, max 2228 ms
- plan_obnovy_subsidy: 3/3, max 2624 ms
- photovoltaics_heat_pump: 3/3, max 2780 ms
- mss_solar: 3/3, max 3563 ms
- garden_frost_free_valve: 3/3, max 2509 ms
- air_conditioning_plural: 3/3, max 2771 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3059 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2245 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 1930 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2014 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 4082 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 1979 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2205 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2624 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2772 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2429 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2321 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2771 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2915 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2493 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2069 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2474 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 3752 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2380 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2228 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2421 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2780 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 3563 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2490 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2392 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2501 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2025 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 1854 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2577 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 4778 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2510 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2097 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2355 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2698 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2414 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2509 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 1987 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
