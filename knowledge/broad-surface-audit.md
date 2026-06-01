# Broad Surface Audit

Generated: 2026-06-01T14:28:59.051Z
Max response time: 8000 ms

## Summary

- cases: 43
- passed: 43
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3394 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 3961 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2154 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2494 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2607 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2211 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2952 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2494 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2176 | yes | direct_answer | heat_pump | process | 3 |  |
| vaillant_boilers | yes | 2261 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2295 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3576 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3395 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 2523 | yes | rag_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 2216 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2909 | yes | rag_answer | heat_pump | comparison | 3 |  |
| central_vacuum | yes | 2969 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2171 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2007 | yes | direct_answer | service | process | 3 |  |
| gas_leak_safety | yes | 2465 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 3191 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2839 | yes | service_fault_triage | service | service_fault | 3 |  |
| emergency_callout | yes | 1940 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 2011 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2305 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2215 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 2149 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2100 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2401 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2215 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1839 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1719 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2135 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1695 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1804 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 3886 | yes | qualification_question | unknown | recommendation | 3 |  |
| process_installation | yes | 2687 | yes | direct_answer | complex_solution | location | 3 |  |
| docs_after_install | yes | 1801 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2778 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1817 | yes | direct_answer | unknown | general | 3 |  |
| small_talk | yes | 2237 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1720 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2502 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
