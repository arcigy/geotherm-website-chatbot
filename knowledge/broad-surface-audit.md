# Broad Surface Audit

Generated: 2026-06-02T04:56:48.426Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3386 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2811 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2636 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2052 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2574 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 3023 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 1790 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2804 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 1923 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 1729 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 1448 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 4221 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 2999 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 2097 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 1726 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 1836 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2967 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 1857 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 3365 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2443 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 5025 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 1676 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 1644 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1736 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 1771 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 1834 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1853 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1781 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2109 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 1693 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1451 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1791 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1725 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1719 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1694 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1642 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 1750 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1553 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2605 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1692 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1862 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 1555 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 1963 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1989 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1758 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2953 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 1790 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 2083 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2581 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 3397 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1695 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 1710 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 1822 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1846 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 1811 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 2308 | yes | ai_fallback | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1560 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2118 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
