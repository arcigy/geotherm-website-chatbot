# Provider Resilience Audit

Generated: 2026-06-03T13:24:21.741Z
Scenarios: 16
Repeats per scenario: 3
Attempts: 48
Max response time: 8000 ms

## Summary

- passed: 48
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 4455 ms
- max response time: 5271 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3492 ms
- services_overview: 3/3, max 2885 ms
- vague_heat_pump_followup: 3/3, max 2167 ms
- old_house_radiators_verdict: 3/3, max 2723 ms
- new_build_closure_models_cta: 3/3, max 5271 ms
- third_party_service_cautious: 3/3, max 2571 ms
- buffer_tank_price_scope: 3/3, max 2645 ms
- plan_obnovy_subsidy: 3/3, max 2536 ms
- photovoltaics_heat_pump: 3/3, max 3148 ms
- mss_solar: 3/3, max 2698 ms
- garden_frost_free_valve: 3/3, max 3503 ms
- air_conditioning_plural: 3/3, max 2669 ms
- out_of_scope_weather_ai: 3/3, max 3444 ms
- prompt_injection_price_ai: 3/3, max 4455 ms
- subsidy_guarantee_ai: 3/3, max 2964 ms
- roi_guarantee_ai: 3/3, max 2791 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3492 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2885 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2136 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2723 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3620 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2334 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2645 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2536 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2532 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2698 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 3503 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2669 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 1 | yes | 3444 | yes | general_chat | unknown | general | 0 |  |
| prompt_injection_price_ai | 1 | yes | 4455 | yes | ai_fallback | unknown | general | 0 |  |
| subsidy_guarantee_ai | 1 | yes | 2964 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 1 | yes | 2791 | yes | price_answer | heat_pump | price | 3 |  |
| small_talk_no_rag | 2 | yes | 3430 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2564 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2167 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2447 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 5271 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 1935 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2151 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 1963 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2975 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2609 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2260 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 1915 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 2 | yes | 3265 | yes | general_chat | unknown | general | 0 |  |
| prompt_injection_price_ai | 2 | yes | 3967 | yes | ai_fallback | unknown | general | 0 |  |
| subsidy_guarantee_ai | 2 | yes | 2492 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 2 | yes | 2338 | yes | price_answer | heat_pump | price | 3 |  |
| small_talk_no_rag | 3 | yes | 2892 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2544 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2006 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2191 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 4880 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2571 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2380 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2415 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 3148 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2362 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2567 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2631 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 3 | yes | 2751 | yes | general_chat | unknown | general | 0 |  |
| prompt_injection_price_ai | 3 | yes | 4273 | yes | ai_fallback | unknown | general | 0 |  |
| subsidy_guarantee_ai | 3 | yes | 2753 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 3 | yes | 2552 | yes | price_answer | heat_pump | price | 3 |  |

## Failed Answer Samples

None
