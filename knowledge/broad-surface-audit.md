# Broad Surface Audit

Generated: 2026-06-03T14:32:40.004Z
Max response time: 8000 ms

## Summary

- cases: 63
- passed: 63
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 2868 | yes | direct_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2030 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| photovoltaics_standalone | yes | 2977 | yes | direct_answer | complex_solution | process | 3 |  |
| solar_collector_tank | yes | 2321 | yes | direct_answer | complex_solution | process | 3 |  |
| heat_pumps | yes | 2615 | yes | direct_answer | heat_pump | process | 3 |  |
| air_conditioning | yes | 2922 | yes | qualification_question | air_conditioning | recommendation | 3 |  |
| heat_recovery | yes | 2358 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2608 | yes | direct_answer | floor_heating | process | 3 |  |
| ceiling_cooling | yes | 1825 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| wall_heating_cooling | yes | 2409 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2320 | yes | direct_answer | heat_pump | process | 3 |  |
| boilers | yes | 2421 | yes | direct_answer | service | process | 3 |  |
| vaillant_boilers | yes | 2227 | yes | direct_answer | service | process | 3 |  |
| water_distribution | yes | 2562 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 2455 | yes | direct_answer | unknown | process | 3 |  |
| wc_geberit | yes | 2285 | yes | direct_answer | unknown | process | 3 |  |
| screeds | yes | 2720 | yes | direct_answer | floor_heating | price | 3 |  |
| solar_panels | yes | 3079 | yes | direct_answer | complex_solution | process | 3 |  |
| photovoltaics | yes | 2669 | yes | direct_answer | complex_solution | process | 3 |  |
| central_vacuum | yes | 2606 | yes | direct_answer | unknown | process | 3 |  |
| boreholes | yes | 2428 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2788 | yes | direct_answer | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2961 | yes | direct_answer | service | service_fault | 3 |  |
| pressure_drop | yes | 2812 | yes | direct_answer | service | service_fault | 3 |  |
| third_party_service | yes | 2589 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 2621 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1954 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2148 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2105 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1981 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2378 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2358 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2135 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 2190 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1982 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2340 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1998 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1922 | yes | direct_answer | service | process | 3 |  |
| boiler_certificate | yes | 1928 | yes | direct_answer | service | process | 3 |  |
| references | yes | 2652 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 3306 | yes | direct_answer | unknown | process | 3 |  |
| docs_after_install | yes | 2732 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2774 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1886 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1736 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2162 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 1999 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 2411 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 2113 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2844 | yes | direct_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 1839 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 2242 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2713 | yes | direct_answer | service | process | 3 |  |
| project_help | yes | 2538 | yes | direct_answer | complex_solution | process | 3 |  |
| business_customers | yes | 2240 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2142 | yes | direct_answer | complex_solution | process | 3 |  |
| small_jobs | yes | 2158 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 2343 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2169 | yes | direct_answer | service | process | 3 |  |
| small_talk_greeting_how_are_you | yes | 2765 | yes | general_chat | unknown | general | 0 |  |
| small_talk | yes | 2422 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1956 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 3115 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
