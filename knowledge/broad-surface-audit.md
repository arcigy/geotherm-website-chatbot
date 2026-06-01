# Broad Surface Audit

Generated: 2026-06-01T15:27:16.450Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 4261 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 3656 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2381 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2971 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 3093 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2829 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 3702 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2664 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2012 | yes | direct_answer | heat_pump | process | 3 |  |
| vaillant_boilers | yes | 2236 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 1906 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 4394 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3846 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 2039 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 2148 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2180 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 3125 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2051 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 4060 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2345 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 4165 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 3163 | yes | service_fault_triage | service | service_fault | 3 |  |
| emergency_callout | yes | 1810 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1979 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 4508 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2046 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1818 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2234 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2557 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2306 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 2013 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1774 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2039 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1584 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1747 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1918 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2648 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1711 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2634 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1765 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1972 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2579 | yes | service_fault_triage | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2020 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 4349 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1990 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2987 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 3401 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 2078 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2602 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2513 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1651 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2222 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 2098 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1762 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 1997 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 1640 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1404 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2638 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
