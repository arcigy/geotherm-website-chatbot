# Broad Surface Audit

Generated: 2026-06-02T04:11:34.263Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3728 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 3531 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2098 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2438 | yes | qualification_question | air_conditioning | recommendation | 3 |  |
| heat_recovery | yes | 3002 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2767 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2258 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2602 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 1867 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 1803 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2048 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3976 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 2934 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1679 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 2086 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 1772 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2641 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 1896 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 4024 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2009 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 3643 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 1769 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 1461 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1673 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 1855 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 1899 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1912 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1645 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2214 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 1780 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1826 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1485 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1876 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1504 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1468 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1539 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2463 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1810 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2403 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1666 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1779 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 1881 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 1808 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1803 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1657 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2912 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 1582 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 1506 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2786 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2560 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 2092 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 1805 | yes | direct_answer | complex_solution | process | 3 |  |
| small_jobs | yes | 2104 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1853 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2128 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 2250 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1414 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2881 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
