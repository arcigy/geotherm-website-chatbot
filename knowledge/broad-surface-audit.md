# Broad Surface Audit

Generated: 2026-06-01T13:41:47.328Z
Max response time: 8000 ms

## Summary

- cases: 42
- passed: 42
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3541 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2407 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2476 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| air_conditioning | yes | 2157 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2200 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2313 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2586 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2588 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2050 | yes | direct_answer | heat_pump | process | 3 |  |
| vaillant_boilers | yes | 2392 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2423 | yes | rag_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3514 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 2949 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 2674 | yes | rag_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 1855 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2998 | yes | rag_answer | heat_pump | comparison | 3 |  |
| central_vacuum | yes | 3294 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 1900 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 1869 | yes | direct_answer | service | process | 3 |  |
| gas_leak_safety | yes | 2105 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 4605 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2388 | yes | service_fault_triage | service | service_fault | 3 |  |
| emergency_callout | yes | 1765 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1536 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2058 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2257 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 2220 | yes | service_fault_triage | service | inspection | 3 |  |
| quote_free | yes | 1912 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2629 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 1948 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1725 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1806 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1876 | yes | service_fault_triage | service | process | 3 |  |
| insurance | yes | 1620 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1622 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 3513 | yes | rag_answer | unknown | general | 3 |  |
| process_installation | yes | 2437 | yes | direct_answer | complex_solution | location | 3 |  |
| docs_after_install | yes | 1709 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2954 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1855 | yes | direct_answer | unknown | general | 3 |  |
| small_talk | yes | 2257 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2567 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
