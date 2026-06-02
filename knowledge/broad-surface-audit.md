# Broad Surface Audit

Generated: 2026-06-02T03:57:48.777Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3123 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 3661 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2370 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2341 | yes | qualification_question | air_conditioning | recommendation | 3 |  |
| heat_recovery | yes | 2329 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2578 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 3175 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2419 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2105 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 1987 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 1802 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3659 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3372 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1830 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 1567 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2267 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2592 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2026 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 3007 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 1844 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 3039 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 1773 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 1942 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1837 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 1911 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 1830 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 2046 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1954 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 1784 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 1854 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1892 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1625 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1782 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1629 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1508 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1619 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2004 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1655 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 1860 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1605 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 2026 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2083 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 1706 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1621 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1845 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2382 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 2181 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 2068 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2476 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2649 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1981 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 1941 | yes | direct_answer | complex_solution | process | 3 |  |
| small_jobs | yes | 1920 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 2067 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 1942 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 1511 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1369 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2415 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
