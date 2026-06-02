# Provider Resilience Audit

Generated: 2026-06-02T15:17:42.787Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 3749 ms
- max response time: 4386 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3749 ms
- services_overview: 3/3, max 2543 ms
- vague_heat_pump_followup: 3/3, max 3097 ms
- old_house_radiators_verdict: 3/3, max 2778 ms
- new_build_closure_models_cta: 3/3, max 4386 ms
- third_party_service_cautious: 3/3, max 2457 ms
- buffer_tank_price_scope: 3/3, max 3241 ms
- plan_obnovy_subsidy: 3/3, max 2746 ms
- photovoltaics_heat_pump: 3/3, max 2886 ms
- mss_solar: 3/3, max 2559 ms
- garden_frost_free_valve: 3/3, max 2484 ms
- air_conditioning_plural: 3/3, max 2312 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3749 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2500 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2104 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2778 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3072 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2457 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 3241 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2475 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2400 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2559 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2484 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2226 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2607 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2283 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 1939 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2379 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 3717 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2355 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2071 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2746 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2886 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2233 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 1906 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2312 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2922 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2543 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 3097 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2685 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 4386 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2316 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 1979 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2281 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2168 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2018 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2287 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2286 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
