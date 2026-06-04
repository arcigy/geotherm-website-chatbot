# Non-Heat-Pump Flow Audit

Generated: 2026-06-04T11:38:55.163Z
Scenarios: 12
Turns: 36
Passed turns: 36
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
- sanitary_scope: PASS (3/3)
- solar_photovoltaic_scope: PASS (3/3)
- screeds_scope: PASS (3/3)

## Turns

| Scenario | Turn | Pass | ms | LLM | Mode | Service | Intent | Sources | Message | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- | --- |
| air_conditioning_multisplit | 1 | yes | 2801 | yes | direct_answer | air_conditioning | recommendation | 3 | Chcem chladenie do domu |  |
| air_conditioning_multisplit | 2 | yes | 3405 | yes | qualification_question | air_conditioning | recommendation | 3 | Obyvacka a spalna, spolu asi 45m2 |  |
| air_conditioning_multisplit | 3 | yes | 2558 | yes | handoff_cta | air_conditioning | quote | 3 | chcem to nacenit |  |
| heat_recovery_new_build | 1 | yes | 2817 | yes | qualification_question | heat_recovery | recommendation | 3 | Chcem lepsi vzduch v dome bez otvarania okien |  |
| heat_recovery_new_build | 2 | yes | 2761 | yes | qualification_question | heat_recovery | recommendation | 3 | novostavba 140m2, cely dom |  |
| heat_recovery_new_build | 3 | yes | 1975 | yes | handoff_cta | heat_recovery | quote | 3 | chcem ponuku |  |
| floor_heating_quote | 1 | yes | 2027 | yes | direct_answer | floor_heating | process | 3 | Robite podlahovku do domu? |  |
| floor_heating_quote | 2 | yes | 2562 | yes | direct_answer | floor_heating | process | 3 | novostavba 120m2 |  |
| floor_heating_quote | 3 | yes | 3031 | yes | handoff_cta | floor_heating | quote | 3 | chcem nacenit |  |
| ceiling_cooling_new_build | 1 | yes | 2459 | yes | direct_answer | ceiling_cooling | recommendation | 3 | Viete spravit stropne chladenie? |  |
| ceiling_cooling_new_build | 2 | yes | 2381 | yes | rag_answer | ceiling_cooling | quote | 3 | novostavba 130m2, cely dom |  |
| ceiling_cooling_new_build | 3 | yes | 2583 | yes | direct_answer | ceiling_cooling | recommendation | 3 | chcem vediet najlepsie riesenie |  |
| service_fault_triage | 1 | yes | 2378 | yes | service_fault_triage | service | service_fault | 3 | Kotol ukazuje chybu, co robit? |  |
| service_fault_triage | 2 | yes | 2702 | yes | direct_answer | service | service_fault | 3 | Vaillant, kod F.75, Trnava |  |
| service_fault_triage | 3 | yes | 2106 | yes | service_fault_triage | service | contact | 3 | chcem servis |  |
| subsidy_assistance | 1 | yes | 2433 | yes | direct_answer | subsidy | subsidy | 3 | Vybavite mi dotaciu na tepelne cerpadlo? |  |
| subsidy_assistance | 2 | yes | 2658 | yes | direct_answer | subsidy | subsidy | 3 | rodinny dom, vymena plynoveho kotla |  |
| subsidy_assistance | 3 | yes | 2289 | yes | direct_answer | subsidy | subsidy | 3 | chcem s tym pomoct |  |
| complex_house_solution | 1 | yes | 2388 | yes | qualification_question | complex_solution | recommendation | 3 | Novostavba, chcem kurenie, vetranie aj chladenie |  |
| complex_house_solution | 2 | yes | 3482 | yes | diagnostic_verdict | complex_solution | recommendation | 3 | 120m2, podlahovka, 4 osoby |  |
| complex_house_solution | 3 | yes | 3168 | yes | diagnostic_verdict | complex_solution | recommendation | 3 | co by ste navrhli? |  |
| water_softener_scope | 1 | yes | 2481 | yes | direct_answer | water | process | 3 | Mate aj zmakcovac vody? |  |
| water_softener_scope | 2 | yes | 2630 | yes | direct_answer | water | process | 3 | do rodinneho domu, tvrda voda |  |
| water_softener_scope | 3 | yes | 2382 | yes | handoff_cta | water | quote | 3 | chcem nacenit |  |
| central_vacuum_scope | 1 | yes | 2391 | yes | direct_answer | central_vacuum | process | 3 | Robite centralne vysavace? |  |
| central_vacuum_scope | 2 | yes | 2302 | yes | direct_answer | central_vacuum | process | 3 | novostavba bungalov 150m2 |  |
| central_vacuum_scope | 3 | yes | 2114 | yes | direct_answer | central_vacuum | process | 3 | chcem vediet postup |  |
| sanitary_scope | 1 | yes | 2158 | yes | direct_answer | sanitary | process | 3 | Robite Geberit a zdravotechniku? |  |
| sanitary_scope | 2 | yes | 2553 | yes | direct_answer | sanitary | process | 3 | rekonstrukcia kupelne a rozvody vody |  |
| sanitary_scope | 3 | yes | 2296 | yes | handoff_cta | sanitary | quote | 3 | chcem nacenit |  |
| solar_photovoltaic_scope | 1 | yes | 2351 | yes | direct_answer | solar_photovoltaic | process | 3 | Robite fotovoltaiku? |  |
| solar_photovoltaic_scope | 2 | yes | 4022 | yes | rag_answer | solar_photovoltaic | process | 3 | rodinny dom, chcem ju k tepelnemu cerpadlu |  |
| solar_photovoltaic_scope | 3 | yes | 2525 | yes | handoff_cta | solar_photovoltaic | quote | 3 | chcem nacenenie |  |
| screeds_scope | 1 | yes | 2793 | yes | direct_answer | screeds | price | 3 | Robite aj anhydritove potery? |  |
| screeds_scope | 2 | yes | 4299 | yes | rag_answer | screeds | price | 3 | novostavba 120m2 s podlahovkou |  |
| screeds_scope | 3 | yes | 4536 | yes | rag_answer | screeds | process | 3 | aka je dalsia cesta? |  |

## Failed Answer Samples

