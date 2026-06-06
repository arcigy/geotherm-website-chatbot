# Broad Surface Audit

Generated: 2026-06-06T21:18:49.082Z
Max response time: 8000 ms

## Summary

- cases: 67
- passed: 67
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 2092 | yes | direct_answer | company | general | 3 |  |
| initial_heat_pump_short | yes | 1891 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| photovoltaics_standalone | yes | 2234 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| solar_collector_tank | yes | 2107 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| heat_pumps | yes | 2283 | yes | direct_answer | heat_pump | process | 3 |  |
| air_conditioning | yes | 2223 | yes | rag_answer | air_conditioning | general | 3 |  |
| heat_recovery | yes | 2501 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 1797 | yes | direct_answer | floor_heating | process | 3 |  |
| ceiling_cooling | yes | 1591 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| wall_heating_cooling | yes | 1573 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 1813 | yes | direct_answer | radiators | process | 3 |  |
| boilers | yes | 1791 | yes | direct_answer | boilers | process | 3 |  |
| vaillant_boilers | yes | 1823 | yes | direct_answer | boilers | process | 3 |  |
| water_distribution | yes | 1883 | yes | direct_answer | water | process | 3 |  |
| water_treatment | yes | 1815 | yes | direct_answer | water | process | 3 |  |
| system_fluids | yes | 1800 | yes | direct_answer | service | process | 3 |  |
| wc_geberit | yes | 1828 | yes | direct_answer | sanitary | process | 3 |  |
| screeds | yes | 2059 | yes | direct_answer | screeds | price | 3 |  |
| solar_panels | yes | 1950 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| photovoltaics | yes | 2059 | yes | direct_answer | solar_photovoltaic | process | 3 |  |
| central_vacuum | yes | 2045 | yes | direct_answer | central_vacuum | process | 3 |  |
| boreholes | yes | 1831 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2226 | yes | direct_answer | service | service_fault | 3 |  |
| preventive_heat_pump_service | yes | 1558 | yes | direct_answer | service | process | 3 |  |
| gas_leak_safety | yes | 2121 | yes | direct_answer | service | service_fault | 3 |  |
| pressure_drop | yes | 2353 | yes | direct_answer | service | service_fault | 3 |  |
| third_party_service | yes | 1830 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 1677 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1720 | yes | direct_answer | company | contact | 3 |  |
| today_visit | yes | 1542 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 1855 | yes | direct_answer | company | location | 3 |  |
| inspection_paid | yes | 1528 | yes | direct_answer | company | inspection | 3 |  |
| quote_free | yes | 1807 | yes | direct_answer | company | quote | 3 |  |
| quote_inputs | yes | 2360 | yes | direct_answer | company | quote | 3 |  |
| quote_from_photos | yes | 1605 | yes | direct_answer | company | quote | 3 |  |
| whatsapp | yes | 1644 | yes | direct_answer | company | contact | 3 |  |
| payment_options | yes | 1816 | yes | direct_answer | company | price | 3 |  |
| warranty_work | yes | 1628 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1437 | yes | direct_answer | company | process | 3 |  |
| certification_gas | yes | 1629 | yes | direct_answer | service | process | 3 |  |
| boiler_certificate | yes | 1757 | yes | direct_answer | service | process | 3 |  |
| references | yes | 2064 | yes | direct_answer | company | process | 3 |  |
| process_installation | yes | 2018 | yes | direct_answer | company | process | 3 |  |
| docs_after_install | yes | 1465 | yes | direct_answer | company | process | 3 |  |
| subsidy_help | yes | 2858 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1439 | yes | direct_answer | company | general | 3 |  |
| callout_price | yes | 1599 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 1591 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 1634 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 1794 | yes | direct_answer | boilers | process | 3 |  |
| boiler_revision | yes | 1774 | yes | direct_answer | boilers | process | 3 |  |
| heating_reconstruction | yes | 1943 | yes | direct_answer | company | process | 3 |  |
| heating_terms | yes | 1870 | yes | direct_answer | complex_solution | process | 3 |  |
| heating_curve_regulation | yes | 1842 | yes | direct_answer | complex_solution | process | 3 |  |
| bathroom_core | yes | 1818 | yes | direct_answer | sanitary | process | 3 |  |
| chimney_work | yes | 1734 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2167 | yes | direct_answer | boilers | process | 3 |  |
| project_help | yes | 1789 | yes | direct_answer | company | process | 3 |  |
| business_customers | yes | 1534 | yes | direct_answer | company | process | 3 |  |
| apartment_buildings | yes | 1523 | yes | direct_answer | company | process | 3 |  |
| small_jobs | yes | 1634 | yes | direct_answer | company | process | 3 |  |
| customer_bought_boiler | yes | 1636 | yes | direct_answer | boilers | process | 3 |  |
| boiler_brand_question | yes | 1790 | yes | direct_answer | boilers | process | 3 |  |
| small_talk_greeting_how_are_you | yes | 2718 | yes | general_chat | unknown | general | 0 |  |
| small_talk | yes | 1408 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1957 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 1763 | yes | ai_fallback | unknown | general | 0 |  |

## Failed Answer Samples
