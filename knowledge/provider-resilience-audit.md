# Provider Resilience Audit

Generated: 2026-06-03T22:37:22.676Z
Scenarios: 16
Repeats per scenario: 3
Attempts: 48
Max response time: 8000 ms

## Summary

- passed: 48
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 3339 ms
- max response time: 5173 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3432 ms
- services_overview: 3/3, max 2510 ms
- vague_heat_pump_followup: 3/3, max 2332 ms
- old_house_radiators_verdict: 3/3, max 2620 ms
- new_build_closure_models_cta: 3/3, max 5173 ms
- third_party_service_cautious: 3/3, max 2005 ms
- buffer_tank_price_scope: 3/3, max 1902 ms
- plan_obnovy_subsidy: 3/3, max 2608 ms
- photovoltaics_heat_pump: 3/3, max 2486 ms
- mss_solar: 3/3, max 2583 ms
- garden_frost_free_valve: 3/3, max 2386 ms
- air_conditioning_plural: 3/3, max 2238 ms
- out_of_scope_weather_ai: 3/3, max 2225 ms
- prompt_injection_price_ai: 3/3, max 3321 ms
- subsidy_guarantee_ai: 3/3, max 2405 ms
- roi_guarantee_ai: 3/3, max 2326 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3432 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2337 | yes | direct_answer | company | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2332 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2381 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3339 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2001 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 1902 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2608 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2334 | yes | handoff_cta | solar_photovoltaic | quote | 3 |  |
| mss_solar | 1 | yes | 2583 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2386 | yes | direct_answer | water | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2182 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 1 | yes | 2225 | yes | ai_fallback | unknown | general | 0 |  |
| prompt_injection_price_ai | 1 | yes | 3321 | yes | ai_fallback | unknown | quote | 3 |  |
| subsidy_guarantee_ai | 1 | yes | 2283 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 1 | yes | 2326 | yes | price_answer | heat_pump | price | 3 |  |
| small_talk_no_rag | 2 | yes | 2442 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2299 | yes | direct_answer | company | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 1876 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2620 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 3055 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2005 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 1884 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2297 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2441 | yes | handoff_cta | solar_photovoltaic | quote | 3 |  |
| mss_solar | 2 | yes | 2162 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 1919 | yes | direct_answer | water | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2238 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 2 | yes | 2155 | yes | ai_fallback | unknown | general | 0 |  |
| prompt_injection_price_ai | 2 | yes | 3130 | yes | ai_fallback | unknown | quote | 3 |  |
| subsidy_guarantee_ai | 2 | yes | 2405 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 2 | yes | 2228 | yes | price_answer | heat_pump | price | 3 |  |
| small_talk_no_rag | 3 | yes | 2601 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2510 | yes | direct_answer | company | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 1827 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2600 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 5173 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 1766 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 1852 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2363 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2486 | yes | handoff_cta | solar_photovoltaic | quote | 3 |  |
| mss_solar | 3 | yes | 2054 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2087 | yes | direct_answer | water | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2041 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 3 | yes | 2103 | yes | ai_fallback | unknown | general | 0 |  |
| prompt_injection_price_ai | 3 | yes | 3274 | yes | ai_fallback | unknown | quote | 3 |  |
| subsidy_guarantee_ai | 3 | yes | 2112 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 3 | yes | 2246 | yes | price_answer | heat_pump | price | 3 |  |

## Failed Answer Samples

None
