# Provider Resilience Audit

Generated: 2026-06-02T16:48:35.631Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 4712 ms
- max response time: 5524 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3406 ms
- services_overview: 3/3, max 2430 ms
- vague_heat_pump_followup: 3/3, max 2004 ms
- old_house_radiators_verdict: 3/3, max 2783 ms
- new_build_closure_models_cta: 3/3, max 5524 ms
- third_party_service_cautious: 3/3, max 2879 ms
- buffer_tank_price_scope: 3/3, max 2891 ms
- plan_obnovy_subsidy: 3/3, max 2941 ms
- photovoltaics_heat_pump: 3/3, max 3084 ms
- mss_solar: 3/3, max 2569 ms
- garden_frost_free_valve: 3/3, max 2450 ms
- air_conditioning_plural: 3/3, max 2439 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3406 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2430 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 1944 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2681 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 4478 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2122 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2111 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2242 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 3084 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2404 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 1826 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2261 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 3146 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2359 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2004 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2783 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 4712 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2496 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2363 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2714 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2729 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2253 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2444 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2284 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2560 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2199 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 1941 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2361 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 5524 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2879 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2891 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2941 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2935 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2569 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2450 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2439 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
