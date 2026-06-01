# Broad Surface Audit

Generated: 2026-06-01T14:59:35.790Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3415 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 3492 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2552 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2905 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2767 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2596 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 3086 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 4205 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2110 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 2193 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2034 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3480 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3546 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1849 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 1928 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2589 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2990 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 1921 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 3836 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2552 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 4431 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2671 | yes | service_fault_triage | service | service_fault | 3 |  |
| emergency_callout | yes | 1898 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 2066 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2042 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2463 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1957 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2161 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2660 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2878 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 2090 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1913 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2155 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1802 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1750 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 2006 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2425 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 2115 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 3101 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1960 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1856 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2540 | yes | service_fault_triage | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2075 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 2142 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1822 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2601 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 2338 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 2304 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 3204 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2331 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1947 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2016 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 2034 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 2064 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2116 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 1949 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1501 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2376 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
