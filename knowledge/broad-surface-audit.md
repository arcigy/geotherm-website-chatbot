# Broad Surface Audit

Generated: 2026-06-01T13:35:25.536Z
Max response time: 8000 ms

## Summary

- cases: 42
- passed: 42
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3268 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2408 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2669 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2239 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2133 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2116 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2210 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2371 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 1912 | yes | direct_answer | heat_pump | process | 3 |  |
| vaillant_boilers | yes | 2510 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 3530 | yes | rag_answer | complex_solution | general | 3 |  |
| water_treatment | yes | 3485 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3007 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 2370 | yes | rag_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 1613 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2222 | yes | rag_answer | heat_pump | comparison | 3 |  |
| central_vacuum | yes | 2845 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 1860 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 1828 | yes | direct_answer | service | process | 3 |  |
| gas_leak_safety | yes | 2043 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 2905 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 3065 | yes | service_fault_triage | service | service_fault | 3 |  |
| emergency_callout | yes | 1810 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1580 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 1775 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 1871 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 2235 | yes | service_fault_triage | service | inspection | 3 |  |
| quote_free | yes | 2149 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2218 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2054 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 2149 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1704 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2227 | yes | service_fault_triage | service | process | 3 |  |
| insurance | yes | 1414 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1547 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 3196 | yes | qualification_question | unknown | recommendation | 3 |  |
| process_installation | yes | 2537 | yes | direct_answer | complex_solution | location | 3 |  |
| docs_after_install | yes | 1857 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 3169 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1757 | yes | direct_answer | unknown | general | 3 |  |
| small_talk | yes | 1387 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2715 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
