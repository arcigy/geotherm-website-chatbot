# Broad Surface Audit

Generated: 2026-06-01T22:32:25.501Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3437 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2929 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2643 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2068 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2758 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2380 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2711 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 3414 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2110 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 2006 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 1760 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3230 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 2980 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1690 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 1971 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 1963 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2683 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2118 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2850 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2002 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 4590 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 1796 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 2261 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1761 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 1883 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2232 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1977 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1993 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2298 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 1941 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 2129 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 2072 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1803 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1617 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1462 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1752 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 1859 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1754 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2645 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1779 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1822 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2112 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2075 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 2077 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1690 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2433 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 2054 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 1921 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2500 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2755 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1954 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 1736 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 1851 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 2009 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 1977 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 1962 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1391 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2650 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
