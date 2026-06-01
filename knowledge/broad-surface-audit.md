# Broad Surface Audit

Generated: 2026-06-01T21:01:19.309Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 4221 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 4385 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2546 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2881 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2657 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2323 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2563 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2736 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 1896 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 2058 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2048 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3250 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 2996 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1695 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 1917 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2202 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 3683 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2035 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 3143 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2449 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 4586 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2098 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 1818 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1677 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 1950 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 1878 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1797 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1718 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2117 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 1998 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1896 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1784 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2236 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1582 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1579 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1738 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2256 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1758 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2525 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1702 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1917 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 2142 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2080 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 2075 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1944 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2795 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 1908 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 1829 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2772 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2260 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1811 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2133 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 1964 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 2115 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2093 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 2101 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1806 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2669 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
