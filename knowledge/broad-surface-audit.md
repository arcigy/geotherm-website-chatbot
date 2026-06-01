# Broad Surface Audit

Generated: 2026-06-01T14:23:25.567Z
Max response time: 8000 ms

## Summary

- cases: 43
- passed: 43
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 4126 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2950 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2475 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| air_conditioning | yes | 2569 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2704 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2488 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 3161 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2556 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2191 | yes | direct_answer | heat_pump | process | 3 |  |
| vaillant_boilers | yes | 2271 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2151 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 4001 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3150 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 3028 | yes | rag_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 2184 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 4361 | yes | rag_answer | heat_pump | comparison | 3 |  |
| central_vacuum | yes | 3046 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2076 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2444 | yes | direct_answer | service | process | 3 |  |
| gas_leak_safety | yes | 3016 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 3178 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2873 | yes | service_fault_triage | service | service_fault | 3 |  |
| emergency_callout | yes | 1975 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1735 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2225 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2326 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1957 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2079 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2482 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2130 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 2214 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1907 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1967 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1686 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1839 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 3925 | yes | qualification_question | unknown | recommendation | 3 |  |
| process_installation | yes | 2644 | yes | direct_answer | complex_solution | location | 3 |  |
| docs_after_install | yes | 2020 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 3108 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1893 | yes | direct_answer | unknown | general | 3 |  |
| small_talk | yes | 2004 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1712 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 3247 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
