# Non-Heat-Pump Flow Audit

Generated: 2026-06-02T17:13:31.182Z
Scenarios: 9
Turns: 27
Passed turns: 27
Failed turns: 0
Max response time: 8000 ms
Verdict: PASS

## Scenario Summary

- air_conditioning_multisplit: PASS (3/3)
- heat_recovery_new_build: PASS (3/3)
- floor_heating_quote: PASS (3/3)
- ceiling_cooling_new_build: PASS (3/3)
- service_fault_triage: PASS (3/3)
- subsidy_assistance: PASS (3/3)
- complex_house_solution: PASS (3/3)
- water_softener_scope: PASS (3/3)
- central_vacuum_scope: PASS (3/3)

## Turns

| Scenario | Turn | Pass | ms | LLM | Mode | Service | Intent | Sources | Message | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- | --- |
| air_conditioning_multisplit | 1 | yes | 2465 | yes | direct_answer | air_conditioning | recommendation | 3 | Chcem chladenie do domu |  |
| air_conditioning_multisplit | 2 | yes | 3392 | yes | qualification_question | air_conditioning | recommendation | 3 | Obyvacka a spalna, spolu asi 45m2 |  |
| air_conditioning_multisplit | 3 | yes | 2817 | yes | price_answer | air_conditioning | price | 3 | chcem to nacenit |  |
| heat_recovery_new_build | 1 | yes | 2719 | yes | qualification_question | heat_recovery | recommendation | 3 | Chcem lepsi vzduch v dome bez otvarania okien |  |
| heat_recovery_new_build | 2 | yes | 2602 | yes | qualification_question | heat_recovery | recommendation | 3 | novostavba 140m2, cely dom |  |
| heat_recovery_new_build | 3 | yes | 2356 | yes | price_answer | heat_recovery | price | 3 | chcem ponuku |  |
| floor_heating_quote | 1 | yes | 2244 | yes | direct_answer | floor_heating | process | 3 | Robite podlahovku do domu? |  |
| floor_heating_quote | 2 | yes | 2829 | yes | direct_answer | floor_heating | process | 3 | novostavba 120m2 |  |
| floor_heating_quote | 3 | yes | 2508 | yes | price_answer | floor_heating | price | 3 | chcem nacenit |  |
| ceiling_cooling_new_build | 1 | yes | 2138 | yes | direct_answer | ceiling_cooling | recommendation | 3 | Viete spravit stropne chladenie? |  |
| ceiling_cooling_new_build | 2 | yes | 4431 | yes | rag_answer | ceiling_cooling | quote | 3 | novostavba 130m2, cely dom |  |
| ceiling_cooling_new_build | 3 | yes | 2780 | yes | rag_answer | ceiling_cooling | recommendation | 3 | chcem vediet najlepsie riesenie |  |
| service_fault_triage | 1 | yes | 2575 | yes | direct_answer | service | service_fault | 3 | Kotol ukazuje chybu, co robit? |  |
| service_fault_triage | 2 | yes | 2497 | yes | direct_answer | service | service_fault | 3 | Vaillant, kod F.75, Trnava |  |
| service_fault_triage | 3 | yes | 2255 | yes | service_fault_triage | service | contact | 3 | chcem servis |  |
| subsidy_assistance | 1 | yes | 2498 | yes | direct_answer | subsidy | subsidy | 3 | Vybavite mi dotaciu na tepelne cerpadlo? |  |
| subsidy_assistance | 2 | yes | 2417 | yes | direct_answer | subsidy | process | 3 | rodinny dom, vymena plynoveho kotla |  |
| subsidy_assistance | 3 | yes | 2422 | yes | direct_answer | subsidy | subsidy | 3 | chcem s tym pomoct |  |
| complex_house_solution | 1 | yes | 3076 | yes | rag_answer | complex_solution | recommendation | 3 | Novostavba, chcem kurenie, vetranie aj chladenie |  |
| complex_house_solution | 2 | yes | 3010 | yes | diagnostic_verdict | complex_solution | recommendation | 3 | 120m2, podlahovka, 4 osoby |  |
| complex_house_solution | 3 | yes | 3702 | yes | diagnostic_verdict | complex_solution | recommendation | 3 | co by ste navrhli? |  |
| water_softener_scope | 1 | yes | 2305 | yes | direct_answer | unknown | process | 3 | Mate aj zmakcovac vody? |  |
| water_softener_scope | 2 | yes | 4853 | yes | rag_answer | unknown | process | 3 | do rodinneho domu, tvrda voda |  |
| water_softener_scope | 3 | yes | 2509 | yes | price_answer | unknown | price | 3 | chcem nacenit |  |
| central_vacuum_scope | 1 | yes | 2014 | yes | direct_answer | unknown | process | 3 | Robite centralne vysavace? |  |
| central_vacuum_scope | 2 | yes | 2062 | yes | direct_answer | unknown | process | 3 | novostavba bungalov 150m2 |  |
| central_vacuum_scope | 3 | yes | 3307 | yes | direct_answer | unknown | process | 3 | chcem vediet postup |  |

## Failed Answer Samples

