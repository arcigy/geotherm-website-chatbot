# Provider Resilience Audit

Generated: 2026-06-03T09:28:12.562Z
Scenarios: 12
Repeats per scenario: 3
Attempts: 36
Max response time: 8000 ms

## Summary

- passed: 36
- failed: 0
- llmUsed=false: 0
- over 8000 ms: 0
- p95 response time: 4291 ms
- max response time: 6662 ms
- verdict: PASS

## Scenario Summary

- small_talk_no_rag: 3/3, max 3777 ms
- services_overview: 3/3, max 6662 ms
- vague_heat_pump_followup: 3/3, max 3242 ms
- old_house_radiators_verdict: 3/3, max 2163 ms
- new_build_closure_models_cta: 3/3, max 3260 ms
- third_party_service_cautious: 3/3, max 2042 ms
- buffer_tank_price_scope: 3/3, max 1978 ms
- plan_obnovy_subsidy: 3/3, max 2485 ms
- photovoltaics_heat_pump: 3/3, max 2709 ms
- mss_solar: 3/3, max 4291 ms
- garden_frost_free_valve: 3/3, max 2425 ms
- air_conditioning_plural: 3/3, max 4082 ms

## Attempts

| Scenario | Run | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_no_rag | 1 | yes | 3030 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 1 | yes | 1917 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 1 | yes | 1789 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 1 | yes | 2163 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 1 | yes | 3260 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 1 | yes | 1914 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 1 | yes | 1978 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 1 | yes | 2224 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 1 | yes | 2709 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 1 | yes | 4291 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 1 | yes | 2425 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 1 | yes | 4082 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 2 | yes | 3777 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 2 | yes | 3922 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 2 | yes | 3242 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 2 | yes | 2149 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 2 | yes | 2923 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 2 | yes | 2042 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 2 | yes | 1958 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 2 | yes | 2362 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 2 | yes | 2241 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 2 | yes | 2087 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 2 | yes | 1949 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 2 | yes | 2309 | yes | direct_answer | air_conditioning | recommendation | 3 |  |
| small_talk_no_rag | 3 | yes | 2663 | yes | general_chat | unknown | general | 0 |  |
| services_overview | 3 | yes | 6662 | yes | direct_answer | unknown | general | 3 |  |
| vague_heat_pump_followup | 3 | yes | 1712 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | 3 | yes | 2050 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_models_cta | 3 | yes | 2885 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| third_party_service_cautious | 3 | yes | 2042 | yes | direct_answer | service | service_fault | 3 |  |
| buffer_tank_price_scope | 3 | yes | 1696 | yes | price_answer | heat_pump | price | 3 |  |
| plan_obnovy_subsidy | 3 | yes | 2485 | yes | direct_answer | subsidy | subsidy | 3 |  |
| photovoltaics_heat_pump | 3 | yes | 2163 | yes | direct_answer | heat_pump | process | 3 |  |
| mss_solar | 3 | yes | 2135 | yes | direct_answer | complex_solution | process | 3 |  |
| garden_frost_free_valve | 3 | yes | 1957 | yes | direct_answer | unknown | process | 3 |  |
| air_conditioning_plural | 3 | yes | 1870 | yes | direct_answer | air_conditioning | recommendation | 3 |  |

## Failed Answer Samples

None
