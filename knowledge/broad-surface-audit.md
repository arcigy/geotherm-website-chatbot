# Broad Surface Audit

Generated: 2026-06-01T20:11:25.288Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3483 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 4397 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2934 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2215 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2934 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2495 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2518 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2137 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 1968 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 2060 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2120 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 4136 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3488 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 2004 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 2008 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2485 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2919 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2076 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2626 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2453 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 3625 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2281 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 1631 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1911 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2331 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2068 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1779 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2043 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2556 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 2163 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1915 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1911 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1940 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1687 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1681 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 2120 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2422 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1851 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2381 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1883 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1996 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2157 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2014 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1761 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1809 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2655 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 2019 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 2025 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2452 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2321 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1863 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2059 | yes | direct_answer | complex_solution | process | 3 |  |
| small_jobs | yes | 2545 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1930 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2255 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 1821 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1533 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2928 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
