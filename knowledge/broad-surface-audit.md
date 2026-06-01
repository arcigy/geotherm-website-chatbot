# Broad Surface Audit

Generated: 2026-06-01T16:51:29.666Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3806 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 3577 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2888 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2870 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2352 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2315 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2404 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2323 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2275 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 2331 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2119 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3303 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3575 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 2034 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 2085 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2097 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2890 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2025 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 3289 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2309 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 4957 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2394 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 1904 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 2053 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2256 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2815 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1641 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1960 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2364 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 2424 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1833 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1898 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1842 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1896 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 2061 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1948 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2688 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 2108 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2922 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1751 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 2111 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2494 | yes | service_fault_triage | service | service_fault | 3 |  |
| existing_boiler_service | yes | 1851 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1953 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 2147 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2803 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 1953 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 2156 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 3212 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2572 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1785 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2259 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 2572 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1903 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2876 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 2152 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1801 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2421 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
