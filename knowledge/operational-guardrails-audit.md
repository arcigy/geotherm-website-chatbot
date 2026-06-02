# Operational Guardrails Audit

Generated: 2026-06-02T20:25:58.887Z
Cases: 30
Passed: 30
Failed: 0
Max response time: 8000 ms
Verdict: PASS

| Case | Pass | ms | LLM | Mode | Service | Intent | Sources | Failures |
| --- | --- | ---: | --- | --- | --- | --- | ---: | --- |
| emergency_callouts | yes | 2422 | yes | direct_answer | service | service_fault | 3 |  |
| service_area | yes | 6077 | yes | direct_answer | unknown | location | 3 |  |
| today_visit | yes | 2132 | yes | direct_answer | service | contact | 3 |  |
| weekend_work | yes | 1850 | yes | direct_answer | service | contact | 3 |  |
| inspection_paid | yes | 1917 | yes | direct_answer | service | inspection | 3 |  |
| quote_free | yes | 1970 | yes | direct_answer | unknown | quote | 3 |  |
| photo_quote | yes | 2340 | yes | direct_answer | unknown | quote | 3 |  |
| email_contact | yes | 1783 | yes | direct_answer | unknown | contact | 3 |  |
| whatsapp_contact | yes | 2255 | yes | direct_answer | unknown | contact | 3 |  |
| deposits | yes | 1885 | yes | direct_answer | unknown | price | 3 |  |
| invoice_payment | yes | 1834 | yes | direct_answer | unknown | price | 3 |  |
| installments | yes | 1810 | yes | direct_answer | unknown | price | 3 |  |
| warranty_work | yes | 2000 | yes | direct_answer | service | process | 3 |  |
| insurance | yes | 1640 | yes | direct_answer | unknown | process | 3 |  |
| gas_certification | yes | 1866 | yes | direct_answer | heat_pump | process | 3 |  |
| docs_after_install | yes | 1764 | yes | direct_answer | unknown | process | 3 |  |
| company_age | yes | 1659 | yes | direct_answer | unknown | general | 3 |  |
| references | yes | 2399 | yes | direct_answer | unknown | process | 3 |  |
| diagnostics_visit | yes | 2291 | yes | service_fault_triage | service | service_fault | 3 |  |
| personal_visit | yes | 2833 | yes | service_fault_triage | service | inspection | 3 |  |
| video_inspection | yes | 2439 | yes | direct_answer | service | inspection | 3 |  |
| order_process | yes | 2108 | yes | direct_answer | unknown | process | 3 |  |
| booking | yes | 2022 | yes | direct_answer | service | contact | 3 |  |
| response_time | yes | 2256 | yes | direct_answer | unknown | contact | 3 |  |
| realization_contact | yes | 1903 | yes | direct_answer | unknown | contact | 3 |  |
| warranty_service | yes | 1831 | yes | direct_answer | service | service_fault | 3 |  |
| post_warranty_service | yes | 1955 | yes | direct_answer | service | service_fault | 3 |  |
| service_order_process | yes | 2352 | yes | direct_answer | service | service_fault | 3 |  |
| own_material | yes | 2244 | yes | direct_answer | unknown | process | 3 |  |
| small_jobs | yes | 1977 | yes | direct_answer | unknown | process | 3 |  |

## Failed Answer Samples

