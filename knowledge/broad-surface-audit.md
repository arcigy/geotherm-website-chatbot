# Broad Surface Audit

Generated: 2026-06-03T14:50:13.801Z
Max response time: 8000 ms

## Summary

- cases: 64
- passed: 64
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 2887 | yes | direct_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2135 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| photovoltaics_standalone | yes | 2571 | yes | direct_answer | complex_solution | process | 3 |  |
| solar_collector_tank | yes | 2132 | yes | direct_answer | complex_solution | process | 3 |  |
| heat_pumps | yes | 3101 | yes | direct_answer | heat_pump | process | 3 |  |
| air_conditioning | yes | 3150 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 3046 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 1958 | yes | direct_answer | floor_heating | process | 3 |  |
| ceiling_cooling | yes | 2402 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| wall_heating_cooling | yes | 1946 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2489 | yes | direct_answer | heat_pump | process | 3 |  |
| boilers | yes | 2294 | yes | direct_answer | service | process | 3 |  |
| vaillant_boilers | yes | 2614 | yes | direct_answer | service | process | 3 |  |
| water_distribution | yes | 2488 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 2866 | yes | direct_answer | unknown | process | 3 |  |
| system_fluids | yes | 2530 | yes | direct_answer | service | process | 3 |  |
| wc_geberit | yes | 2711 | yes | direct_answer | unknown | process | 3 |  |
| screeds | yes | 2205 | yes | direct_answer | floor_heating | price | 3 |  |
| solar_panels | yes | 2148 | yes | direct_answer | complex_solution | process | 3 |  |
| photovoltaics | yes | 2155 | yes | direct_answer | complex_solution | process | 3 |  |
| central_vacuum | yes | 2757 | yes | direct_answer | unknown | process | 3 |  |
| boreholes | yes | 1918 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2495 | yes | direct_answer | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2733 | yes | direct_answer | service | service_fault | 3 |  |
| pressure_drop | yes | 2937 | yes | direct_answer | service | service_fault | 3 |  |
| third_party_service | yes | 1881 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 2536 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 2078 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2051 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2291 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 2121 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2239 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2841 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2328 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1953 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1969 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2070 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1840 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 2005 | yes | direct_answer | service | process | 3 |  |
| boiler_certificate | yes | 2000 | yes | direct_answer | service | process | 3 |  |
| references | yes | 2651 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2694 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1897 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 3424 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1952 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1983 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2290 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2231 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 2198 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1940 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2453 | yes | direct_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 2140 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 3323 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2552 | yes | direct_answer | service | process | 3 |  |
| project_help | yes | 2575 | yes | direct_answer | complex_solution | process | 3 |  |
| business_customers | yes | 2177 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 1885 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 2405 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 2230 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2104 | yes | direct_answer | service | process | 3 |  |
| small_talk_greeting_how_are_you | yes | 3493 | yes | general_chat | unknown | general | 0 |  |
| small_talk | yes | 1627 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 2057 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 3069 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
