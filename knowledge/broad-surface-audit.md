# Broad Surface Audit

Generated: 2026-06-01T23:35:18.138Z
Max response time: 8000 ms

## Summary

- cases: 58
- passed: 58
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 3322 | yes | rag_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2567 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| heat_pumps | yes | 3373 | yes | rag_answer | heat_pump | general | 3 |  |
| air_conditioning | yes | 2895 | yes | qualification_question | air_conditioning | recommendation | 3 |  |
| heat_recovery | yes | 2266 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2047 | yes | rag_answer | floor_heating | general | 3 |  |
| ceiling_cooling | yes | 2321 | yes | qualification_question | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 2671 | yes | rag_answer | heat_pump | general | 3 |  |
| boilers | yes | 2183 | yes | direct_answer | complex_solution | process | 3 |  |
| vaillant_boilers | yes | 1990 | yes | direct_answer | complex_solution | process | 3 |  |
| water_distribution | yes | 1819 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 3533 | yes | rag_answer | unknown | general | 3 |  |
| wc_geberit | yes | 3090 | yes | rag_answer | unknown | general | 3 |  |
| screeds | yes | 1880 | yes | direct_answer | floor_heating | process | 3 |  |
| solar_panels | yes | 1850 | yes | direct_answer | unknown | process | 3 |  |
| photovoltaics | yes | 2125 | yes | direct_answer | heat_pump | process | 3 |  |
| central_vacuum | yes | 2744 | yes | rag_answer | unknown | general | 3 |  |
| boreholes | yes | 1979 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2751 | yes | service_fault_triage | service | service_fault | 3 |  |
| gas_leak_safety | yes | 2192 | yes | rag_answer | heat_pump | general | 3 |  |
| pressure_drop | yes | 3587 | yes | service_fault_triage | service | service_fault | 3 |  |
| third_party_service | yes | 1984 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 1782 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1780 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 1912 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 1797 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1788 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1980 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2041 | yes | direct_answer | unknown | process | 3 |  |
| quote_from_photos | yes | 1979 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1737 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1757 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 1889 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1739 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1578 | yes | direct_answer | heat_pump | process | 3 |  |
| references | yes | 1701 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2230 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 1757 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 2918 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1430 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1877 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 1791 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2065 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1769 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1754 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2645 | yes | rag_answer | heat_pump | process | 3 |  |
| bathroom_core | yes | 2159 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 1587 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2552 | yes | rag_answer | complex_solution | process | 3 |  |
| project_help | yes | 2483 | yes | rag_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1905 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2074 | yes | direct_answer | complex_solution | process | 3 |  |
| small_jobs | yes | 2013 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 2164 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 1899 | yes | direct_answer | complex_solution | process | 3 |  |
| small_talk | yes | 1944 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1450 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 2590 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
