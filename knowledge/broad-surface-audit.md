# Broad Surface Audit

Generated: 2026-06-03T15:03:22.981Z
Max response time: 8000 ms

## Summary

- cases: 66
- passed: 66
- failed: 0
- verdict: PASS

## Cases

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| services_overview | yes | 2854 | yes | direct_answer | unknown | general | 3 |  |
| initial_heat_pump_short | yes | 2324 | yes | qualification_question | heat_pump | recommendation | 3 |  |
| photovoltaics_standalone | yes | 2826 | yes | direct_answer | complex_solution | process | 3 |  |
| solar_collector_tank | yes | 2094 | yes | direct_answer | complex_solution | process | 3 |  |
| heat_pumps | yes | 2386 | yes | direct_answer | heat_pump | process | 3 |  |
| air_conditioning | yes | 2824 | yes | qualification_question | air_conditioning | recommendation | 3 |  |
| heat_recovery | yes | 3209 | yes | rag_answer | heat_recovery | general | 3 |  |
| floor_heating | yes | 2547 | yes | direct_answer | floor_heating | process | 3 |  |
| ceiling_cooling | yes | 1935 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| wall_heating_cooling | yes | 2210 | yes | direct_answer | ceiling_cooling | recommendation | 3 |  |
| radiators | yes | 3464 | yes | direct_answer | heat_pump | process | 3 |  |
| boilers | yes | 2285 | yes | direct_answer | service | process | 3 |  |
| vaillant_boilers | yes | 2531 | yes | direct_answer | service | process | 3 |  |
| water_distribution | yes | 2581 | yes | direct_answer | complex_solution | process | 3 |  |
| water_treatment | yes | 2226 | yes | direct_answer | unknown | process | 3 |  |
| system_fluids | yes | 3563 | yes | direct_answer | service | process | 3 |  |
| wc_geberit | yes | 2617 | yes | direct_answer | unknown | process | 3 |  |
| screeds | yes | 2173 | yes | direct_answer | floor_heating | price | 3 |  |
| solar_panels | yes | 2470 | yes | direct_answer | complex_solution | process | 3 |  |
| photovoltaics | yes | 2394 | yes | direct_answer | complex_solution | process | 3 |  |
| central_vacuum | yes | 2323 | yes | direct_answer | unknown | process | 3 |  |
| boreholes | yes | 2408 | yes | direct_answer | heat_pump | process | 3 |  |
| service_fault | yes | 2344 | yes | direct_answer | service | service_fault | 3 |  |
| preventive_heat_pump_service | yes | 2121 | yes | direct_answer | service | process | 3 |  |
| gas_leak_safety | yes | 2604 | yes | direct_answer | service | service_fault | 3 |  |
| pressure_drop | yes | 2696 | yes | direct_answer | service | service_fault | 3 |  |
| third_party_service | yes | 1872 | yes | direct_answer | service | service_fault | 3 |  |
| emergency_callout | yes | 2179 | yes | direct_answer | service | service_fault | 3 |  |
| weekends | yes | 1928 | yes | direct_answer | service | contact | 3 |  |
| today_visit | yes | 1935 | yes | direct_answer | service | contact | 3 |  |
| service_area | yes | 2262 | yes | direct_answer | unknown | location | 3 |  |
| inspection_paid | yes | 1986 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 2262 | yes | direct_answer | unknown | quote | 3 |  |
| quote_inputs | yes | 2602 | yes | direct_answer | unknown | quote | 3 |  |
| quote_from_photos | yes | 2112 | yes | direct_answer | unknown | quote | 3 |  |
| whatsapp | yes | 1844 | yes | direct_answer | unknown | contact | 3 |  |
| payment_options | yes | 1831 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2290 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1662 | yes | direct_answer | unknown | process | 3 |  |
| certification_gas | yes | 1795 | yes | direct_answer | service | process | 3 |  |
| boiler_certificate | yes | 2200 | yes | direct_answer | service | process | 3 |  |
| references | yes | 2061 | yes | direct_answer | unknown | process | 3 |  |
| process_installation | yes | 2258 | yes | direct_answer | complex_solution | process | 3 |  |
| docs_after_install | yes | 2339 | yes | direct_answer | unknown | process | 3 |  |
| subsidy_help | yes | 3531 | yes | rag_answer | subsidy | subsidy | 3 |  |
| company_age | yes | 1857 | yes | direct_answer | unknown | general | 3 |  |
| callout_price | yes | 1776 | yes | direct_answer | service | service_fault | 3 |  |
| service_wait_time | yes | 1994 | yes | direct_answer | service | service_fault | 3 |  |
| existing_boiler_service | yes | 2207 | yes | direct_answer | service | service_fault | 3 |  |
| gas_revision | yes | 2192 | yes | direct_answer | service | process | 3 |  |
| boiler_revision | yes | 1880 | yes | direct_answer | service | process | 3 |  |
| heating_reconstruction | yes | 2483 | yes | direct_answer | heat_pump | process | 3 |  |
| heating_terms | yes | 2372 | yes | direct_answer | complex_solution | process | 3 |  |
| bathroom_core | yes | 2280 | yes | direct_answer | complex_solution | process | 3 |  |
| chimney_work | yes | 3283 | yes | direct_answer | unknown | process | 3 |  |
| boiler_electrical | yes | 2556 | yes | direct_answer | service | process | 3 |  |
| project_help | yes | 1875 | yes | direct_answer | complex_solution | process | 3 |  |
| business_customers | yes | 1685 | yes | direct_answer | unknown | process | 3 |  |
| apartment_buildings | yes | 2453 | yes | direct_answer | complex_solution | process | 3 |  |
| small_jobs | yes | 2268 | yes | direct_answer | unknown | process | 3 |  |
| customer_bought_boiler | yes | 2188 | yes | direct_answer | service | process | 3 |  |
| boiler_brand_question | yes | 2163 | yes | direct_answer | service | process | 3 |  |
| small_talk_greeting_how_are_you | yes | 2937 | yes | general_chat | unknown | general | 0 |  |
| small_talk | yes | 2323 | yes | general_chat | unknown | general | 0 |  |
| small_talk_how_are_you | yes | 1826 | yes | general_chat | unknown | general | 0 |  |
| weather_out_of_scope | yes | 3267 | yes | general_chat | unknown | general | 0 |  |

## Failed Answer Samples
