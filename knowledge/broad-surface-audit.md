# Broad Surface Audit

Generated: 2026-06-03T14:39:57.344Z
Max response time: 8000 ms

## Summary

- cases: 63
- passed: 63
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 2580 | yes | direct_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2219 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| photovoltaics_standalone | yes | 2612 | yes | direct_answer | complex_solution | process | 3 |  |
| solar_collector_tank | yes | 1957 | yes | direct_answer | complex_solution | process | 3 |  |
| heat_pumps | yes | 2510 | yes | direct_answer | heat_pump | process | 3 |  |
| air_conditioning | yes | 2886 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2740 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2020 | yes | direct_answer | floor_heating | process | 3 |  |
| ceiling_cooling | yes | 2339 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| wall_heating_cooling | yes | 2267 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2236 | yes | direct_answer | heat_pump | process | 3 |  |
| boilers | yes | 2232 | yes | direct_answer | service | process | 3 |  |
| vaillant_boilers | yes | 2268 | yes | direct_answer | service | process | 3 |  |
| water_distribution | yes | 2646 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 2830 | yes | direct_answer | unknown | process | 3 |  |
| wc_geberit | yes | 2626 | yes | direct_answer | unknown | process | 3 |  |
| screeds | yes | 2695 | yes | direct_answer | floor_heating | price | 3 |  |
| solar_panels | yes | 2461 | yes | direct_answer | complex_solution | process | 3 |  |
| photovoltaics | yes | 2937 | yes | direct_answer | complex_solution | process | 3 |  |
| central_vacuum | yes | 2345 | yes | direct_answer | unknown | process | 3 |  |
| boreholes | yes | 2643 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2576 | yes | direct_answer | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2903 | yes | direct_answer | service | service_fault | 3 |  |
| pressure_drop | yes | 2985 | yes | direct_answer | service | service_fault | 3 |  |
| third_party_service | yes | 2350 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 2251 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1923 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2133 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2101 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 2219 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2009 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2802 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 1892 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 2161 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1666 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2070 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1746 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1800 | yes | direct_answer | service | process | 3 |  |
| boiler_certificate | yes | 2214 | yes | direct_answer | service | process | 3 |  |
| references | yes | 2603 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2370 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 2000 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 3132 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1883 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1922 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2189 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2141 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1948 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 2002 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2229 | yes | direct_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 1865 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 1989 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2430 | yes | direct_answer | service | process | 3 |  |
| project_help | yes | 3330 | yes | direct_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1786 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2438 | yes | direct_answer | complex_solution | process | 3 |  |
| small_jobs | yes | 2516 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1981 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2049 | yes | direct_answer | service | process | 3 |  |
| small_talk_greeting_how_are_you | yes | 2868 | yes | general_chat | unknown | general | 0 |  |
| small_talk | yes | 1909 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 2569 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 3682 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
