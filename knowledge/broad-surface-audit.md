# Broad Surface Audit

Generated: 2026-06-01T13:29:51.966Z
Max response time: 8000 ms

## Summary

- cases: 41
- passed: 41
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3316 | yes | rag_answer | unknown | general | 3 |  |
| heat_pumps | yes | 2384 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| air_conditioning | yes | 1999 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2307 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2131 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2432 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2135 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 1862 | yes | direct_answer | heat_pump | process | 3 |  |
| vaillant_boilers | yes | 2231 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 3478 | yes | rag_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3431 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3358 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 2092 | yes | rag_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 2069 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 3130 | yes | rag_answer | heat_pump | comparison | 3 |  |
| central_vacuum | yes | 2917 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2108 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 1889 | yes | direct_answer | service | process | 3 |  |
| gas_leak_safety | yes | 2099 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 2931 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2377 | yes | service_fault_triage | service | service_fault | 3 |  |
| emergency_callout | yes | 1690 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1827 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 1767 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 1984 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 2285 | yes | service_fault_triage | service | inspection | 3 |  |
| quote_free | yes | 1964 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2354 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2091 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1740 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1706 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1935 | yes | service_fault_triage | service | process | 3 |  |
| insurance | yes | 1601 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1634 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 3433 | yes | qualification_question | unknown | recommendation | 3 |  |
| process_installation | yes | 2344 | yes | direct_answer | complex_solution | location | 3 |  |
| docs_after_install | yes | 1817 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 3147 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1572 | yes | direct_answer | unknown | general | 3 |  |
| small_talk | yes | 3395 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2884 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
