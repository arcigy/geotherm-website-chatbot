# Broad Surface Audit

Generated: 2026-06-01T14:52:26.284Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3427 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 3746 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2549 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| air_conditioning | yes | 2533 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 3065 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2797 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2920 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 3878 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2268 | yes | direct_answer | heat_pump | process | 3 |  |
| vaillant_boilers | yes | 1933 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2110 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 4096 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3308 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1934 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 2092 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2222 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 3151 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2286 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 3129 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2731 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 3795 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2576 | yes | service_fault_triage | service | service_fault | 3 |  |
| emergency_callout | yes | 1832 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1691 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2089 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2177 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1825 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2381 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2891 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2179 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1847 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1974 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2237 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1888 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1774 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 2258 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2438 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 2190 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2694 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1901 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1916 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2284 | yes | service_fault_triage | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2064 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 2199 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 2008 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 3126 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 1902 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 2077 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2640 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 3845 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 2149 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2184 | yes | direct_answer | complex_solution | process | 3 |  |
| small_jobs | yes | 2065 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1883 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 1995 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 2448 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1919 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2934 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
