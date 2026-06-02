# Provider Resilience Audit

Generated: 2026-06-02T17:16:51.279Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 3942 ms
- max response time: 4965 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 2890 ms
- services_overview: 3/3, max 2314 ms
- vague_heat_pump_followup: 3/3, max 3087 ms
- old_house_radiators_verdict: 3/3, max 2407 ms
- new_build_closure_models_cta: 3/3, max 4965 ms
- third_party_service_cautious: 3/3, max 2442 ms
- buffer_tank_price_scope: 3/3, max 2563 ms
- plan_obnovy_subsidy: 3/3, max 2808 ms
- photovoltaics_heat_pump: 3/3, max 3214 ms
- mss_solar: 3/3, max 2410 ms
- garden_frost_free_valve: 3/3, max 2543 ms
- air_conditioning_plural: 3/3, max 2419 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 2890 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 2122 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 3087 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2407 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3228 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 2442 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 2153 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2478 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2777 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 2410 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2347 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 2419 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 2888 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 2269 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 2187 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2260 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 4965 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2434 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 2445 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2408 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2663 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2320 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 2284 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2349 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2875 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 2314 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 2256 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2281 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 3942 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2395 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 2563 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2808 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 3214 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2190 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 2543 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 2291 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
