# Broad Surface Audit

Generated: 2026-06-01T15:50:11.304Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 4389 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2738 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2276 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| air_conditioning | yes | 2348 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2899 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2378 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 3096 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2973 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2434 | yes | direct_answer | heat_pump | process | 3 |  |
| vaillant_boilers | yes | 2095 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2216 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 4405 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3666 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1718 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 1993 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 1978 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2637 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2029 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 3588 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2503 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 4009 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 3497 | yes | service_fault_triage | service | service_fault | 3 |  |
| emergency_callout | yes | 1907 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1560 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2298 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2117 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1652 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1868 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2229 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2208 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1664 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1940 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1747 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1738 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1589 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1797 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2124 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1862 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2766 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1911 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1844 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2791 | yes | service_fault_triage | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2122 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1841 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1805 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 3378 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 2035 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 2047 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2222 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2375 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1751 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2132 | yes | direct_answer | complex_solution | process | 3 |  |
| small_jobs | yes | 2064 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 2008 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2181 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 3003 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1774 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2710 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
