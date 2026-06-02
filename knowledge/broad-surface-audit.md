# Broad Surface Audit

Generated: 2026-06-02T02:13:17.309Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3355 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 3439 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 2074 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2903 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2681 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 1817 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2251 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2692 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 1959 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 2005 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 2010 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3682 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3191 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1865 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 2118 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2057 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2896 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 1846 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2680 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 3346 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 3081 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 2183 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 1978 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1633 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 1797 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2049 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1761 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1878 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2314 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 1700 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1726 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1758 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1757 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1567 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1445 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1756 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2279 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1692 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2478 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1718 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1666 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 1892 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 1776 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1938 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1772 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2515 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 1779 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 1878 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2630 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2457 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 2211 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 1695 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 1826 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 1717 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 1724 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 3431 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1817 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2121 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
