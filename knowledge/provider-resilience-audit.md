# Provider Resilience Audit

Generated: 2026-06-03T17:39:07.861Z
Scenarios: 16
Repeats per scenario: 3
Attempts: 48
Max response time: 8000 ms

## Summary

- passed: 48
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 4554 ms
- max response time: 5592 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3844 ms
- services_overview: 3/3, max 2687 ms
- vague_heat_pump_followup: 3/3, max 2308 ms
- old_house_radiators_verdict: 3/3, max 2692 ms
- new_build_closure_models_cta: 3/3, max 5592 ms
- third_party_service_cautious: 3/3, max 2565 ms
- buffer_tank_price_scope: 3/3, max 2438 ms
- plan_obnovy_subsidy: 3/3, max 2775 ms
- photovoltaics_heat_pump: 3/3, max 2934 ms
- mss_solar: 3/3, max 2827 ms
- garden_frost_free_valve: 3/3, max 2554 ms
- air_conditioning_plural: 3/3, max 2439 ms
- out_of_scope_weather_ai: 3/3, max 3410 ms
- prompt_injection_price_ai: 3/3, max 4776 ms
- subsidy_guarantee_ai: 3/3, max 2861 ms
- roi_guarantee_ai: 3/3, max 2598 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3844 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2687 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2308 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2462 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 5592 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2565 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2352 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2562 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2934 | yes | price_answer | complex_solution | price | 3 |  |
| mss_solar | 1 | yes | 2827 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2208 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2439 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 1 | yes | 3318 | yes | general_chat | unknown | general | 0 |  |
| prompt_injection_price_ai | 1 | yes | 4776 | yes | ai_fallback | unknown | general | 0 |  |
| subsidy_guarantee_ai | 1 | yes | 2689 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 1 | yes | 2454 | yes | price_answer | heat_pump | price | 3 |  |
| small_talk_no_rag | 2 | yes | 2996 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2546 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 1983 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2268 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 3530 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2512 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2419 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2775 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2754 | yes | price_answer | complex_solution | price | 3 |  |
| mss_solar | 2 | yes | 2356 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2554 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2293 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 2 | yes | 3392 | yes | general_chat | unknown | general | 0 |  |
| prompt_injection_price_ai | 2 | yes | 4554 | yes | ai_fallback | unknown | general | 0 |  |
| subsidy_guarantee_ai | 2 | yes | 2767 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 2 | yes | 2598 | yes | price_answer | heat_pump | price | 3 |  |
| small_talk_no_rag | 3 | yes | 3388 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2539 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2112 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2692 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 3953 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2213 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2438 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2440 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2898 | yes | price_answer | complex_solution | price | 3 |  |
| mss_solar | 3 | yes | 2361 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2369 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2062 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 3 | yes | 3410 | yes | general_chat | unknown | general | 0 |  |
| prompt_injection_price_ai | 3 | yes | 4163 | yes | ai_fallback | unknown | general | 0 |  |
| subsidy_guarantee_ai | 3 | yes | 2861 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 3 | yes | 2380 | yes | price_answer | heat_pump | price | 3 |  |

## Failed Answer Samples

None
