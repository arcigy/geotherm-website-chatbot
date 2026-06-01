# Production Readiness Audit

Generated: 2026-06-01T14:53:33.570Z
Max response time: 8000 ms

## Summary

- scenarios: 17
- passed: 17
- failed: 0
- verdict: PASS

## Cases

| Scenario | Pass | ms | LLM used | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| small_talk_greeting | yes | 1797 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1778 | yes | general_chat | unknown | general | 0 |  |
| vague_heat_pump_followup | yes | 3771 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| old_house_radiators_verdict | yes | 3510 | yes | diagnostic_verdict | heat_pump | recommendation | 3 |  |
| new_build_closure_cta | yes | 3610 | yes | recommendation_closure | heat_pump | recommendation | 3 |  |
| brands_safe | yes | 1999 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| daikin_correction | yes | 2003 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| price_scope | yes | 2155 | yes | price_answer | heat_pump | price | 3 |  |
| buffer_tank_scope | yes | 1976 | yes | price_answer | heat_pump | price | 3 |  |
| obsolete_f2040 | yes | 1823 | yes | correction_answer | heat_pump | complaint_or_correction | 3 |  |
| unconfirmed_f2050 | yes | 2306 | yes | brand_model_answer | heat_pump | brand_model | 3 |  |
| air_conditioning | yes | 3909 | yes | qualification_question | air_conditioning | recommendation | 3 |  |
| heat_recovery | yes | 3505 | yes | qualification_question | heat_recovery | recommendation | 3 |  |
| floor_heating | yes | 2481 | yes | rag_answer | floor_heating | process | 3 |  |
| ceiling_cooling | yes | 3412 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| service_fault | yes | 3483 | yes | service_fault_triage | service | service_fault | 3 |  |
| subsidy | yes | 2959 | yes | rag_answer | subsidy | subsidy | 3 |  |

## Sample Failed Answers
