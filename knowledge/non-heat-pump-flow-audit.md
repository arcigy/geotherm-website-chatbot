# Non-Heat-Pump Flow Audit

Generated: 2026-06-03T22:39:02.126Z
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
| air_conditioning_multisplit | 1 | yes | 2688 | yes | direct_answer | air_conditioning | recommendation | 3 | Chcem chladenie do domu |  |
| air_conditioning_multisplit | 2 | yes | 3168 | yes | qualification_question | air_conditioning | recommendation | 3 | Obyvacka a spalna, spolu asi 45m2 |  |
| air_conditioning_multisplit | 3 | yes | 2490 | yes | handoff_cta | air_conditioning | quote | 3 | chcem to nacenit |  |
| heat_recovery_new_build | 1 | yes | 2323 | yes | qualification_question | heat_recovery | recommendation | 3 | Chcem lepsi vzduch v dome bez otvarania okien |  |
| heat_recovery_new_build | 2 | yes | 2055 | yes | qualification_question | heat_recovery | recommendation | 3 | novostavba 140m2, cely dom |  |
| heat_recovery_new_build | 3 | yes | 2294 | yes | handoff_cta | heat_recovery | quote | 3 | chcem ponuku |  |
| floor_heating_quote | 1 | yes | 2399 | yes | direct_answer | floor_heating | process | 3 | Robite podlahovku do domu? |  |
| floor_heating_quote | 2 | yes | 2183 | yes | direct_answer | floor_heating | process | 3 | novostavba 120m2 |  |
| floor_heating_quote | 3 | yes | 2034 | yes | handoff_cta | floor_heating | quote | 3 | chcem nacenit |  |
| ceiling_cooling_new_build | 1 | yes | 2271 | yes | direct_answer | ceiling_cooling | recommendation | 3 | Viete spravit stropne chladenie? |  |
| ceiling_cooling_new_build | 2 | yes | 2871 | yes | rag_answer | ceiling_cooling | quote | 3 | novostavba 130m2, cely dom |  |
| ceiling_cooling_new_build | 3 | yes | 1947 | yes | direct_answer | ceiling_cooling | recommendation | 3 | chcem vediet najlepsie riesenie |  |
| service_fault_triage | 1 | yes | 2382 | yes | service_fault_triage | service | service_fault | 3 | Kotol ukazuje chybu, co robit? |  |
| service_fault_triage | 2 | yes | 2520 | yes | direct_answer | service | service_fault | 3 | Vaillant, kod F.75, Trnava |  |
| service_fault_triage | 3 | yes | 2359 | yes | service_fault_triage | service | contact | 3 | chcem servis |  |
| subsidy_assistance | 1 | yes | 2476 | yes | direct_answer | subsidy | subsidy | 3 | Vybavite mi dotaciu na tepelne cerpadlo? |  |
| subsidy_assistance | 2 | yes | 2127 | yes | direct_answer | subsidy | subsidy | 3 | rodinny dom, vymena plynoveho kotla |  |
| subsidy_assistance | 3 | yes | 2414 | yes | direct_answer | subsidy | subsidy | 3 | chcem s tym pomoct |  |
| complex_house_solution | 1 | yes | 2710 | yes | rag_answer | complex_solution | recommendation | 3 | Novostavba, chcem kurenie, vetranie aj chladenie |  |
| complex_house_solution | 2 | yes | 2993 | yes | diagnostic_verdict | complex_solution | recommendation | 3 | 120m2, podlahovka, 4 osoby |  |
| complex_house_solution | 3 | yes | 2600 | yes | diagnostic_verdict | complex_solution | recommendation | 3 | co by ste navrhli? |  |
| water_softener_scope | 1 | yes | 2195 | yes | direct_answer | water | process | 3 | Mate aj zmakcovac vody? |  |
| water_softener_scope | 2 | yes | 2229 | yes | direct_answer | water | process | 3 | do rodinneho domu, tvrda voda |  |
| water_softener_scope | 3 | yes | 2032 | yes | handoff_cta | water | quote | 3 | chcem nacenit |  |
| central_vacuum_scope | 1 | yes | 2241 | yes | direct_answer | central_vacuum | process | 3 | Robite centralne vysavace? |  |
| central_vacuum_scope | 2 | yes | 2588 | yes | direct_answer | central_vacuum | process | 3 | novostavba bungalov 150m2 |  |
| central_vacuum_scope | 3 | yes | 2290 | yes | direct_answer | central_vacuum | process | 3 | chcem vediet postup |  |
| sanitary_scope | 1 | yes | 1757 | yes | direct_answer | sanitary | process | 3 | Robite Geberit a zdravotechniku? |  |
| sanitary_scope | 2 | yes | 2423 | yes | direct_answer | sanitary | process | 3 | rekonstrukcia kupelne a rozvody vody |  |
| sanitary_scope | 3 | yes | 2730 | yes | handoff_cta | sanitary | quote | 3 | chcem nacenit |  |
| solar_photovoltaic_scope | 1 | yes | 2217 | yes | direct_answer | solar_photovoltaic | process | 3 | Robite fotovoltaiku? |  |
| solar_photovoltaic_scope | 2 | yes | 3296 | yes | rag_answer | solar_photovoltaic | process | 3 | rodinny dom, chcem ju k tepelnemu cerpadlu |  |
| solar_photovoltaic_scope | 3 | yes | 2255 | yes | handoff_cta | solar_photovoltaic | quote | 3 | chcem nacenenie |  |
| screeds_scope | 1 | yes | 2011 | yes | direct_answer | screeds | price | 3 | Robite aj anhydritove potery? |  |
| screeds_scope | 2 | yes | 3772 | yes | rag_answer | screeds | price | 3 | novostavba 120m2 s podlahovkou |  |
| screeds_scope | 3 | yes | 3345 | yes | rag_answer | screeds | process | 3 | aka je dalsia cesta? |  |

## Failed Answer Samples

