# Broad Surface Audit

Generated: 2026-06-02T01:07:30.674Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 4760 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 3503 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2602 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2496 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 1914 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2480 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2784 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2676 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 1952 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 1856 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 1793 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 4212 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3400 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1597 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 1763 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2190 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 3124 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 2015 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2411 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 3507 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 3105 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2177 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 2086 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1934 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 2107 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2156 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1962 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1932 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 1973 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 2086 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1986 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1788 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1685 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 2182 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1455 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1749 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2399 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1638 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2821 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1830 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 2523 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 1728 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 1928 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1952 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1986 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 3020 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 1922 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 1840 | yes | direct_answer | service | process | 3 |  |
| boiler_electrical | yes | 2699 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2680 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1958 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2062 | yes | direct_answer | complex_solution | process | 3 |  |
| small_jobs | yes | 2232 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 2061 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2280 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 2030 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1514 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2117 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
