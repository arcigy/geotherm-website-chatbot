# Broad Surface Audit

Generated: 2026-06-02T05:36:11.834Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 2928 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2036 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2313 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2583 | yes | qualification_question | air_conditioning | recommendation | 3 |  |
| heat_recovery | yes | 2693 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2351 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2309 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2359 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 1795 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 1716 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 1853 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3817 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 2643 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1868 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 1650 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 1663 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2481 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2083 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2401 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2133 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 3390 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2048 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 2071 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1687 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 1705 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2135 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1957 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2005 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2393 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 1952 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1650 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1910 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1874 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1592 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1566 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1893 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 1740 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1874 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2290 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1869 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1755 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 1781 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 1663 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1886 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1809 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2664 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 2029 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 1883 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2549 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 1910 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1939 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 1862 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 1815 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1689 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 1956 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 1744 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1812 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2264 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
