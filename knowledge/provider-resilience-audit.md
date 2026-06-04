# Provider Resilience Audit

Generated: 2026-06-04T12:16:32.840Z
Scenarios: 16
Repeats per scenario: 3
Attempts: 48
Max response time: 8000 ms

## Summary

- passed: 48
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 3649 ms
- max response time: 3842 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3762 ms
- services_overview: 3/3, max 2677 ms
- vague_heat_pump_followup: 3/3, max 2515 ms
- old_house_radiators_verdict: 3/3, max 2529 ms
- new_build_closure_models_cta: 3/3, max 2978 ms
- third_party_service_cautious: 3/3, max 2605 ms
- buffer_tank_price_scope: 3/3, max 2572 ms
- plan_obnovy_subsidy: 3/3, max 3059 ms
- photovoltaics_heat_pump: 3/3, max 2787 ms
- mss_solar: 3/3, max 2808 ms
- garden_frost_free_valve: 3/3, max 2675 ms
- air_conditioning_plural: 3/3, max 2525 ms
- out_of_scope_weather_ai: 3/3, max 2585 ms
- prompt_injection_price_ai: 3/3, max 3842 ms
- subsidy_guarantee_ai: 3/3, max 2748 ms
- roi_guarantee_ai: 3/3, max 2423 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3427 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2677 | yes | direct_answer | company | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2260 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2197 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 2706 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2270 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2572 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2665 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2787 | yes | handoff_cta | solar_photovoltaic | quote | 3 |  |
| mss_solar | 1 | yes | 2662 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2675 | yes | direct_answer | water | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2170 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 1 | yes | 2068 | yes | ai_fallback | unknown | general | 0 |  |
| prompt_injection_price_ai | 1 | yes | 3649 | yes | ai_fallback | unknown | quote | 3 |  |
| subsidy_guarantee_ai | 1 | yes | 2017 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 1 | yes | 1976 | yes | price_answer | heat_pump | price | 3 |  |
| small_talk_no_rag | 2 | yes | 3762 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2014 | yes | direct_answer | company | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2199 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2529 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 2873 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 1834 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2133 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 3059 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2583 | yes | handoff_cta | solar_photovoltaic | quote | 3 |  |
| mss_solar | 2 | yes | 2808 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2269 | yes | direct_answer | water | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2525 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 2 | yes | 2572 | yes | ai_fallback | unknown | general | 0 |  |
| prompt_injection_price_ai | 2 | yes | 3842 | yes | ai_fallback | unknown | quote | 3 |  |
| subsidy_guarantee_ai | 2 | yes | 2748 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 2 | yes | 2423 | yes | price_answer | heat_pump | price | 3 |  |
| small_talk_no_rag | 3 | yes | 3534 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2492 | yes | direct_answer | company | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2515 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2516 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 2978 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2605 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 1932 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2597 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2766 | yes | handoff_cta | solar_photovoltaic | quote | 3 |  |
| mss_solar | 3 | yes | 2034 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2619 | yes | direct_answer | water | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2025 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 3 | yes | 2585 | yes | ai_fallback | unknown | general | 0 |  |
| prompt_injection_price_ai | 3 | yes | 3489 | yes | ai_fallback | unknown | quote | 3 |  |
| subsidy_guarantee_ai | 3 | yes | 2320 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 3 | yes | 2410 | yes | price_answer | heat_pump | price | 3 |  |

## Failed Answer Samples

None
