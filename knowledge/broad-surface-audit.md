# Broad Surface Audit

Generated: 2026-06-01T17:52:49.215Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3462 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 5234 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2432 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2260 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2826 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2553 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 3020 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2341 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2311 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 2026 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2182 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 4335 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3532 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1833 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 2229 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2041 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 3131 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 1966 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 4197 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2217 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 3563 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2361 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 1877 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1901 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2177 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 1865 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 2032 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2092 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2431 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 2173 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 2193 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 2008 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2164 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1864 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1817 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1878 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2609 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 2090 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2263 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 2493 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 2246 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2101 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2219 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 2295 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 2164 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2929 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 2064 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 1995 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2394 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2735 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1805 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2379 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 2010 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1838 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2250 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 3415 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1436 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 3049 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
