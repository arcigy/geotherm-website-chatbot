# Broad Surface Audit

Generated: 2026-06-02T12:44:29.120Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3373 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2187 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2240 | yes | direct_answer | heat_pump | process | 3 |  |
| air_conditioning | yes | 2846 | yes | qualification_question | air_conditioning | recommendation | 3 |  |
| heat_recovery | yes | 2610 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2355 | yes | direct_answer | floor_heating | process | 3 |  |
| ceiling_cooling | yes | 2061 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2381 | yes | direct_answer | heat_pump | process | 3 |  |
| boilers | yes | 2498 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 2432 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2848 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 2442 | yes | direct_answer | unknown | process | 3 |  |
| wc_geberit | yes | 2418 | yes | direct_answer | unknown | process | 3 |  |
| screeds | yes | 2845 | yes | direct_answer | floor_heating | price | 3 |  |
| solar_panels | yes | 2176 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2485 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2509 | yes | direct_answer | unknown | process | 3 |  |
| boreholes | yes | 2379 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2655 | yes | direct_answer | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2363 | yes | direct_answer | heat_pump | service_fault | 3 |  |
| pressure_drop | yes | 2234 | yes | direct_answer | service | service_fault | 3 |  |
| third_party_service | yes | 2366 | yes | service_fault_triage | service | service_fault | 3 |  |
| emergency_callout | yes | 2119 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1870 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2594 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2396 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 2165 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2149 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2999 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2478 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 2093 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 2138 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2392 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1915 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 2128 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 2120 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2906 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 2310 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2975 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 2158 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 2222 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 1720 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2361 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 2017 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1891 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2171 | yes | direct_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 1905 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 2209 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2227 | yes | direct_answer | complex_solution | process | 3 |  |
| project_help | yes | 2694 | yes | direct_answer | complex_solution | process | 3 |  |
| business_customers | yes | 2184 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2439 | yes | direct_answer | complex_solution | process | 3 |  |
| small_jobs | yes | 2289 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 2222 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2115 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 2015 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1509 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2555 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
