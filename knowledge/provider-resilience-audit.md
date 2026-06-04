# Provider Resilience Audit

Generated: 2026-06-04T10:48:21.615Z
Scenarios: 16
Repeats per scenario: 3
Attempts: 48
Max response time: 8000 ms

## Summary

- passed: 48
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 3338 ms
- max response time: 4053 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3247 ms
- services_overview: 3/3, max 2787 ms
- vague_heat_pump_followup: 3/3, max 3148 ms
- old_house_radiators_verdict: 3/3, max 2731 ms
- new_build_closure_models_cta: 3/3, max 3295 ms
- third_party_service_cautious: 3/3, max 2522 ms
- buffer_tank_price_scope: 3/3, max 2657 ms
- plan_obnovy_subsidy: 3/3, max 2566 ms
- photovoltaics_heat_pump: 3/3, max 2695 ms
- mss_solar: 3/3, max 2947 ms
- garden_frost_free_valve: 3/3, max 2719 ms
- air_conditioning_plural: 3/3, max 2500 ms
- out_of_scope_weather_ai: 3/3, max 2874 ms
- prompt_injection_price_ai: 3/3, max 4053 ms
- subsidy_guarantee_ai: 3/3, max 2633 ms
- roi_guarantee_ai: 3/3, max 2605 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3247 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2787 | yes | direct_answer | company | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 2118 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2731 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3295 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2522 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2657 | yes | price_answer | unknown | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2551 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2580 | yes | handoff_cta | solar_photovoltaic | quote | 3 |  |
| mss_solar | 1 | yes | 2947 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2545 | yes | direct_answer | water | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2259 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 1 | yes | 2669 | yes | ai_fallback | unknown | general | 0 |  |
| prompt_injection_price_ai | 1 | yes | 4053 | yes | ai_fallback | unknown | quote | 3 |  |
| subsidy_guarantee_ai | 1 | yes | 2633 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 1 | yes | 2605 | yes | price_answer | heat_pump | price | 3 |  |
| small_talk_no_rag | 2 | yes | 3090 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2101 | yes | direct_answer | company | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 3148 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2338 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 2725 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2314 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2100 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2566 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2695 | yes | handoff_cta | solar_photovoltaic | quote | 3 |  |
| mss_solar | 2 | yes | 2112 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2211 | yes | direct_answer | water | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2500 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 2 | yes | 2751 | yes | ai_fallback | unknown | general | 0 |  |
| prompt_injection_price_ai | 2 | yes | 3338 | yes | ai_fallback | unknown | quote | 3 |  |
| subsidy_guarantee_ai | 2 | yes | 2188 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 2 | yes | 2479 | yes | price_answer | heat_pump | price | 3 |  |
| small_talk_no_rag | 3 | yes | 2986 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2066 | yes | direct_answer | company | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2462 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2228 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 2833 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 1863 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2366 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2001 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2489 | yes | handoff_cta | solar_photovoltaic | quote | 3 |  |
| mss_solar | 3 | yes | 2606 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2719 | yes | direct_answer | water | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2146 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| out_of_scope_weather_ai | 3 | yes | 2874 | yes | ai_fallback | unknown | general | 0 |  |
| prompt_injection_price_ai | 3 | yes | 3588 | yes | ai_fallback | unknown | quote | 3 |  |
| subsidy_guarantee_ai | 3 | yes | 2073 | yes | subsidy_answer | subsidy | subsidy | 3 |  |
| roi_guarantee_ai | 3 | yes | 2125 | yes | price_answer | heat_pump | price | 3 |  |

## Failed Answer Samples

None
