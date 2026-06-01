# Broad Surface Audit

Generated: 2026-06-01T17:21:38.893Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 4179 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 3269 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2360 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| air_conditioning | yes | 3144 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2651 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2109 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 3196 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 3149 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2608 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 2048 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 1923 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 4052 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3114 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1593 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 1951 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2238 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2416 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2191 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 3264 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2847 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 2980 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 1922 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 1848 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1769 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2033 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2018 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1664 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1941 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2423 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 2154 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1858 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1754 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1972 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1853 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1906 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1840 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2187 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 2034 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2640 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1903 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 2079 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 1825 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2132 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 2045 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 2474 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2844 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 2390 | yes | direct_answer | unknown | process | 3 |  |
| chimney_work | yes | 1985 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2747 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2384 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 2063 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 1889 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 2137 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1876 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2047 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 3584 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1405 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 6477 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
