# Broad Surface Audit

Generated: 2026-06-01T20:38:52.548Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3458 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2766 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2553 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2103 | yes | qualification_question | air_conditioning | recommendation | 3 |  |
| heat_recovery | yes | 2594 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2515 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2132 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2304 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2023 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 1844 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 1767 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3385 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3439 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1518 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 2112 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2048 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2926 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 1906 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 3049 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2142 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 4309 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2096 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 1890 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1917 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2701 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2070 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1803 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1901 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 1972 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 2030 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1938 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1729 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1887 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1563 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1579 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1801 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 1945 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1597 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2310 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1679 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1972 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 1856 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 1735 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 2336 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1679 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2289 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 2082 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 1960 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2460 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2519 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1913 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 1847 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 1981 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1950 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 1858 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 2852 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1223 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2422 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
