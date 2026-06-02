# Broad Surface Audit

Generated: 2026-06-02T12:24:58.550Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 4285 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2315 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2585 | yes | direct_answer | heat_pump | process | 3 |  |
| air_conditioning | yes | 2359 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 3399 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2550 | yes | direct_answer | floor_heating | process | 3 |  |
| ceiling_cooling | yes | 2216 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2317 | yes | direct_answer | heat_pump | process | 3 |  |
| boilers | yes | 2041 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 2143 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2029 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 2358 | yes | direct_answer | unknown | process | 3 |  |
| wc_geberit | yes | 2919 | yes | direct_answer | unknown | process | 3 |  |
| screeds | yes | 2941 | yes | direct_answer | floor_heating | price | 3 |  |
| solar_panels | yes | 2076 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2107 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2690 | yes | direct_answer | unknown | process | 3 |  |
| boreholes | yes | 2029 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2704 | yes | direct_answer | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2667 | yes | direct_answer | heat_pump | service_fault | 3 |  |
| pressure_drop | yes | 2343 | yes | direct_answer | service | service_fault | 3 |  |
| third_party_service | yes | 2386 | yes | service_fault_triage | service | service_fault | 3 |  |
| emergency_callout | yes | 2589 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 2130 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2215 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2334 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 2149 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1876 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2364 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2170 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1949 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1924 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2055 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1927 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1813 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 2380 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2106 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 2052 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2457 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1861 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 2145 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2056 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 1977 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1815 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 2271 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2692 | yes | direct_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 1893 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 2314 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2397 | yes | direct_answer | complex_solution | process | 3 |  |
| project_help | yes | 2465 | yes | direct_answer | complex_solution | process | 3 |  |
| business_customers | yes | 2211 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2220 | yes | direct_answer | complex_solution | process | 3 |  |
| small_jobs | yes | 2359 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1967 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2224 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 2121 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1547 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2600 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
