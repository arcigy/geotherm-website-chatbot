# Provider Resilience Audit

Generated: 2026-06-02T15:06:27.563Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 4280 ms
- max response time: 5520 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 5520 ms
- services_overview: 3/3, max 2594 ms
- vague_heat_pump_followup: 3/3, max 2232 ms
- old_house_radiators_verdict: 3/3, max 2463 ms
- new_build_closure_models_cta: 3/3, max 4280 ms
- third_party_service_cautious: 3/3, max 2616 ms
- buffer_tank_price_scope: 3/3, max 2330 ms
- plan_obnovy_subsidy: 3/3, max 2548 ms
- photovoltaics_heat_pump: 3/3, max 2843 ms
- mss_solar: 3/3, max 2508 ms
- garden_frost_free_valve: 3/3, max 2865 ms
- air_conditioning_plural: 3/3, max 2365 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3257 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2594 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2171 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2249 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3939 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2340 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 1978 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2195 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2843 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2485 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2326 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2365 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2670 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2198 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2232 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2293 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 4280 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2032 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 1863 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2548 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2583 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 1960 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2128 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2267 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 5520 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 1906 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 1973 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2463 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 4175 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2616 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2330 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2303 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2095 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2508 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2865 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2060 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
