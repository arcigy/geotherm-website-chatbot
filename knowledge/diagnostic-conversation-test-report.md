# Diagnostic Conversation Test Report

Generated: 2026-05-28T22:08:57.289Z
Endpoint: http://127.0.0.1:60796/chat

Verdict: PASS
Failed turns: 0/25

## Novostavba + podlahovka + chladenie

### Turn 1

User: ahoj, ake cerpadlo je najlepsie?
Pass: yes
responseTimeMs: 5765
answerMode: qualification_question
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized, initial_heat_pump_recommendation_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation ahoj, ake cerpadlo je najlepsie?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation ahoj, ake cerpadlo je najlepsie?
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","qualification_question_rounds":0}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"recommendation"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom?
2. koľko m2 chceš vykurovať?
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: 1. novostavbu, 2. 120, 3. podlahovka
Pass: yes
responseTimeMs: 13681
answerMode: ai_fallback
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: deterministic_verdict
questionRoundsCount: 1
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: incomplete_answer_fallback
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie ahoj, ake cerpadlo je najlepsie? 1. novostavbu, 2. 120, 3. podlahovka
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie ahoj, ake cerpadlo je najlepsie? 1. novostavbu, 2. 120, 3. podlahovka
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"heating_distribution":"podlahové kúrenie","qualification_question_rounds":1}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"heating_distribution":"podlahové kúrenie"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Predbežný verdikt

Pre teba by som predbežne išiel do tepelného čerpadla **vzduch-voda** pre **novostavbu s nízkoteplotným podlahovým kúrením** pri dome cca 120 m². Dáva to zmysel hlavne preto, že podlahovka pracuje s nízkou teplotou vody, čo tepelnému čerpadlu vyhovuje.
Konkrétny výkon a model by som vybral až podľa projektu, energetického certifikátu alebo tepelnej straty.

Koľko osôb bude v dome a chceš riešiť aj chladenie v lete?

### Turn 3

User: 1. 5, 2. ano
Pass: yes
responseTimeMs: 8225
answerMode: recommendation_closure
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: true
closureReason: question_budget_exhausted
recommendationOptions: ["Tepelné čerpadlo vzduch-voda pre nízkoteplotné podlahové kúrenie","Tepelné čerpadlo so zásobníkom TÚV podľa počtu osôb","Samostatne navrhnuté chladenie cez stropné chladenie, fancoily alebo klimatizáciu podľa projektu"]
remainingCriticalUnknowns: ["projekt, energetický certifikát alebo tepelná strata"]
validatorsTriggered: inspection_claim_sanitized, recommendation_closure_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie ahoj, ake cerpadlo je najlepsie? 1. novostavbu, 2. 120, 3. podlahovka 1. 5, 2. ano
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie ahoj, ake cerpadlo je najlepsie? 1. novostavbu, 2. 120, 3. podlahovka 1. 5, 2. ano
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"heating_distribution":"podlahové kúrenie","wants_cooling":true,"occupants":5,"qualification_question_rounds":2,"recommendation_closure_offered":true}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"recommendation","wants_cooling":true,"occupants":5}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Predbežné uzavretie odporúčania

Podľa toho, čo píšeš, najlepší predbežný smer je **tepelné čerpadlo vzduch-voda pre nízkoteplotné podlahové kúrenie**.

Dáva to zmysel preto, že podlahovka pracuje s nízkou teplotou vody a tepelnému čerpadlu to vyhovuje. Ak riešiš aj chladenie, netreba automaticky rátať s tým, že podlahové chladenie všetko nahradí; treba navrhnúť samostatné chladenie podľa projektu.

**Možnosti:**
1. Tepelné čerpadlo vzduch-voda pre kúrenie a TÚV.
2. Tepelné čerpadlo + zásobník TÚV podľa počtu osôb.
3. Doplnkové chladenie cez stropné chladenie, fancoily alebo klimatizáciu podľa projektu.

Ďalší krok: pošli projekt, energetický certifikát alebo tepelnú stratu. Potom sa dá pripraviť konkrétnejší návrh.

## Starší dom + radiátory + drevo

### Turn 1

User: ahoj, ake cerpadlo je najlepsie?
Pass: yes
responseTimeMs: 11284
answerMode: qualification_question
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized, initial_heat_pump_recommendation_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation ahoj, ake cerpadlo je najlepsie?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation ahoj, ake cerpadlo je najlepsie?
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","qualification_question_rounds":0}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"recommendation"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom?
2. koľko m2 chceš vykurovať?
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: starsi dom, 150m, mame radiatory
Pass: yes
responseTimeMs: 14633
answerMode: ai_fallback
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: deterministic_verdict
questionRoundsCount: 1
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: incomplete_answer_fallback
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":150,"heating_distribution":"radiátory","qualification_question_rounds":1}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":150,"heating_distribution":"radiátory"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Predbežný verdikt

Pri staršom alebo existujúcom dome s radiátormi pri dome cca 150 m² by som predbežne riešil tepelné čerpadlo **vzduch-voda vhodné pre radiátorový systém**. Dôležité je overiť, či radiátory vykúria dom aj pri nižšej teplote vody, alebo či bude treba upraviť časť vykurovania.

Pred finálnym návrhom treba poznať aktuálny zdroj tepla, zateplenie a aspoň orientačnú spotrebu alebo náhradný odhad.

Čím kúriš teraz a je dom zateplený?

### Turn 3

User: kotol mame drevom a netusim, mam vlastne drevo
Pass: yes
responseTimeMs: 12221
answerMode: diagnostic_verdict
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: wood_replacement_followup_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory aktuálne kúrenie tuhé palivo ročná spotreba nie je známa zákazník má vlastné drevo ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory kotol mame drevom a netusim, mam vlastne drevo
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory aktuálne kúrenie tuhé palivo ročná spotreba nie je známa zákazník má vlastné drevo ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory kotol mame drevom a netusim, mam vlastne drevo
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":150,"current_heating":"tuhé palivo","heating_distribution":"radiátory","annual_consumption_unknown":true,"own_wood":true,"qualification_question_rounds":2}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"recommendation","current_heating":"tuhé palivo","annual_consumption_unknown":true,"own_wood":true}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Predbežný smer pre tvoj dom

Keďže máš starší dom s radiátormi a kúriš drevom, predbežne by som sa zameral na tepelné čerpadlo **vzduch-voda**, ktoré je vhodné pre takéto systémy. Dôležité bude overiť, či tvoje súčasné radiátory dokážu efektívne vykúriť celý dom pri nižšej teplote vody, ktorú tepelné čerpadlo produkuje. Ak nie, môže byť potrebná úprava radiátorov alebo ich častí.

Keďže spomínaš, že máš vlastné drevo, je to dobrý základ, ale pre presnejší návrh tepelného čerpadla by bolo ideálne zistiť, aká je približná ročná spotreba dreva, prípadne aká je tepelná strata domu.

Chcel by si sa o tomto riešení dozvedieť viac, alebo by si chcel rovno dohodnúť obhliadku, kde by sme to prekonzultovali detailnejšie?

Pred finálnym návrhom by som ešte overil hlavne zateplenie domu, orientačné množstvo dreva za sezónu, akumulačnú nádrž a to, či má tepelné čerpadlo riešiť aj teplú vodu.

### Turn 4

User: 4m, zateplene vsetko
Pass: yes
responseTimeMs: 14288
answerMode: recommendation_closure
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: deterministic_verdict
questionRoundsCount: 3
closureGateTriggered: true
closureReason: minimum_slots_plus_enough_context
recommendationOptions: ["Tepelné čerpadlo vzduch-voda ako hlavný zdroj kúrenia","Hybridné zapojenie: tepelné čerpadlo + ponechaný kotol na drevo ako záloha alebo doplnkový zdroj"]
remainingCriticalUnknowns: ["potrebná teplota vody pre radiátory","akumulačná nádrž alebo existujúce zapojenie kotolne","či má systém riešiť teplú vodu"]
validatorsTriggered: incomplete_answer_fallback, recommendation_closure_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory aktuálne kúrenie tuhé palivo spotreba 4 m dreva za sezónu ročná spotreba nie je známa zákazník má vlastné drevo zateplenie zateplený alebo čiastočne zateplený ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory kotol mame drevom a netusim, mam vlastne drevo 4m, zateplene vsetko
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory aktuálne kúrenie tuhé palivo spotreba 4 m dreva za sezónu ročná spotreba nie je známa zákazník má vlastné drevo zateplenie zateplený alebo čiastočne zateplený ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory kotol mame drevom a netusim, mam vlastne drevo 4m, zateplene vsetko
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":150,"current_heating":"tuhé palivo","heating_distribution":"radiátory","insulation":"zateplený alebo čiastočne zateplený","annual_consumption":"4 m dreva za sezónu","annual_consumption_unknown":true,"own_wood":true,"qualification_question_rounds":3,"recommendation_closure_offered":true}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"recommendation","insulation":"zateplený alebo čiastočne zateplený"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Predbežné uzavretie odporúčania

Podľa toho, čo píšeš, by som to už predbežne uzavrel: **najlepší smer je tepelné čerpadlo vzduch-voda vhodné pre radiátorový systém** v zateplenom staršom dome s plochou približne 150 m².

**Prečo:** máš radiátory a dom je zateplený, takže šanca na funkčné riešenie je výrazne lepšia než pri nezateplenom dome. Keďže máš vlastné drevo, nehodnotil by som to iba cez úsporu. Ekonomiku treba overiť, ale hlavný prínos môže byť komfort: automatické kúrenie bez prikladania, menej práce s drevom a možnosť nechať drevo ako zálohu. Beriem údaj **4 m dreva za sezónu** ako orientačnú spotrebu dreva za sezónu. Ak je jednotka iná, pri návrhu sa to jednoducho spresní.

**Reálne by som pozeral na dve možnosti:**
1. **Tepelné čerpadlo vzduch-voda ako hlavný zdroj kúrenia.** Vhodné, ak chceš čo najviac obmedziť prikladanie a mať automatickú prevádzku.
2. **Hybridné zapojenie: tepelné čerpadlo + ponechaný kotol na drevo ako záloha alebo doplnkový zdroj.** Vhodné, ak máš vlastné drevo a chceš ho občas využívať ako zálohu alebo doplnok.

Z portfólia firmy by dávalo zmysel pozrieť sa na vhodné riešenie od **NIBE alebo Vaillant** pre radiátorový systém, ale konkrétny model by sa vybral až podľa výkonu, radiátorov, kotolne a prípravy teplej vody.

Typicky by sa riešila vonkajšia jednotka, vnútorné hydraulické zapojenie, regulácia, prípadne zásobník TÚV, akumulačná nádrž alebo využitie existujúcej nádrže a napojenie na radiátorový systém.

Finálne treba preveriť hlavne teplotu vody pre radiátory, existujúcu akumulačnú nádrž, priestor v kotolni a či má čerpadlo riešiť aj teplú vodu.

Ďalší krok: pošli fotky kotolne, radiátorov a prípadnej akumulačnej nádrže. Potom sa dá pripraviť konkrétnejší návrh alebo dohodnúť obhliadka.

## Klimatizácia do dvoch miestností

### Turn 1

User: chcem klimatizaciu do obyvacky a spalne
Pass: yes
responseTimeMs: 14228
answerMode: ai_fallback
serviceType: air_conditioning
serviceIntent: recommendation
sourcesCount: 3
fallbackType: deterministic_ai_safe
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: incomplete_answer_fallback
retrievalQuery: service router verdict gate service-card-air-conditioning klimatizacie klimatizácie recommendation scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod služba klimatizácie zámer recommendation rieši chladenie chcem klimatizaciu do obyvacky a spalne
enrichedRetrievalQuery: service router verdict gate service-card-air-conditioning klimatizacie klimatizácie recommendation scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod služba klimatizácie zámer recommendation rieši chladenie chcem klimatizaciu do obyvacky a spalne
storedSlots: {"service_type":"air_conditioning","service_intent":"recommendation","wants_cooling":true,"qualification_question_rounds":0}
newlyExtractedSlots: {"service_type":"air_conditioning","service_intent":"recommendation","wants_cooling":true}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Predbežný smer

Pri klimatizácii do viacerých miestností by som predbežne porovnal dve možnosti: viac samostatných jednotiek alebo multisplit. Dôvod je, že rozhoduje dispozícia, dĺžka rozvodov, hluk, servis a miesto pre vonkajšiu jednotku.

Typicky sa overuje plocha miestností, orientácia na slnko a kde môže byť vonkajšia jednotka.

Koľko m² má obývačka a spálňa a kam by sa dala dať vonkajšia jednotka?

## Rekuperácia v novostavbe

### Turn 1

User: staviam dom a chcem lepsi vzduch bez otvarania okien
Pass: yes
responseTimeMs: 14258
answerMode: ai_fallback
serviceType: heat_recovery
serviceIntent: recommendation
sourcesCount: 3
fallbackType: deterministic_ai_safe
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: incomplete_answer_fallback
retrievalQuery: service router verdict gate service-card-heat-recovery rekuperacia vetranie rekuperácia recommendation služba rekuperácia zámer recommendation objekt rodinný dom staviam dom a chcem lepsi vzduch bez otvarania okien
enrichedRetrievalQuery: service router verdict gate service-card-heat-recovery rekuperacia vetranie rekuperácia recommendation služba rekuperácia zámer recommendation objekt rodinný dom staviam dom a chcem lepsi vzduch bez otvarania okien
storedSlots: {"service_type":"heat_recovery","service_intent":"recommendation","project_type":"novostavba","property_type":"rodinný dom","qualification_question_rounds":0}
newlyExtractedSlots: {"service_type":"heat_recovery","service_intent":"recommendation","project_type":"novostavba","property_type":"rodinný dom"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Predbežný smer

Ak staviaš dom a chceš lepší vzduch bez otvárania okien, predbežne dáva zmysel riešiť rekuperáciu už v projekte. Pri novostavbe sa dá najčistejšie navrhnúť centrálna jednotka s rozvodmi pre celý dom.

Treba ešte overiť dispozíciu, technickú miestnosť a či chceš vetrať celý dom alebo len vybrané priestory.

Máš už projekt a chceš riešiť rekuperáciu pre celý dom?

## NIBE servisná chyba

### Turn 1

User: tepelne cerpadlo NIBE mi hlasi chybu
Pass: yes
responseTimeMs: 13830
answerMode: service_fault_triage
serviceType: service
serviceIntent: service_fault
sourcesCount: 3
fallbackType: deterministic_ai_safe
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: incomplete_answer_fallback
retrievalQuery: service router verdict gate service-card-service servis porucha servis zariadení service_fault služba servis zariadení zámer service_fault tepelne cerpadlo NIBE mi hlasi chybu
enrichedRetrievalQuery: service router verdict gate service-card-service servis porucha servis zariadení service_fault služba servis zariadení zámer service_fault tepelne cerpadlo NIBE mi hlasi chybu
storedSlots: {"service_type":"service","service_intent":"service_fault","qualification_question_rounds":0}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"service_fault"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Servisný smer

Pri poruche je najdôležitejšie najprv identifikovať zariadenie a chybu, nie radiť zásahy do jednotky. Všeobecne treba preveriť značku, model, chybový kód a lokalitu; pri cudzej montáži sa dostupnosť servisu musí potvrdiť podľa značky a prípadu.

Pošli mi prosím značku/model alebo fotku štítku a chybový kód z displeja.

Jasné, ďalší krok je, aby sa vám vedel ozvať technik alebo obchodník a dohodol postup. Pošlite prosím telefón alebo e-mail, prípadne aj meno. Kontakt použijeme iba na spätné ozvanie k tomuto dopytu.

## Dotácie

### Turn 1

User: pomozete mi s dotaciou?
Pass: yes
responseTimeMs: 9150
answerMode: rag_answer
serviceType: subsidy
serviceIntent: subsidy
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: none
retrievalQuery: service router verdict gate service-card-subsidy dotacie dotácie subsidy služba dotácie zámer subsidy pomozete mi s dotaciou?
enrichedRetrievalQuery: service router verdict gate service-card-subsidy dotacie dotácie subsidy služba dotácie zámer subsidy pomozete mi s dotaciou?
storedSlots: {"service_type":"subsidy","service_intent":"subsidy","qualification_question_rounds":0}
newlyExtractedSlots: {"service_type":"subsidy","service_intent":"subsidy"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

Ahoj, jasné, s dotáciami ti vieme pomôcť!

### Pomoc s dotáciami

Radi ti asistujeme a poradíme v procese získavania dotácií.

## Priame otazky na znacky, modely a ceny

### Turn 1

User: potreboval by som vybrat tepelne cerpadlo
Pass: yes
responseTimeMs: 7801
answerMode: qualification_question
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized, initial_heat_pump_recommendation_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation potreboval by som vybrat tepelne cerpadlo
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation potreboval by som vybrat tepelne cerpadlo
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","qualification_question_rounds":0}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"recommendation"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom?
2. koľko m2 chceš vykurovať?
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: mam starsi dom, radiatory a chcem usetrit
Pass: yes
responseTimeMs: 15455
answerMode: ai_fallback
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: deterministic_ai_safe
questionRoundsCount: 1
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: incomplete_answer_fallback
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom vykurovanie radiátory potreboval by som vybrat tepelne cerpadlo mam starsi dom, radiatory a chcem usetrit
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom vykurovanie radiátory potreboval by som vybrat tepelne cerpadlo mam starsi dom, radiatory a chcem usetrit
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","property_type":"rodinný dom","heating_distribution":"radiátory","qualification_question_rounds":1}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","property_type":"rodinný dom","heating_distribution":"radiátory"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Predbežný smer pre starší dom s radiátormi

Pri staršom dome s radiátormi dáva predbežne zmysel tepelné čerpadlo **vzduch-voda vhodné pre radiátorový systém**. Dôvod je, že vzduch-voda je pri rekonštrukciách najčastejší smer, ale pri radiátoroch treba overiť potrebnú teplotu vody a výkon radiátorov.

Typicky by sa riešil výkon tepelného čerpadla, hydraulické zapojenie, regulácia, príprava teplej vody a podľa kotolne aj akumulačná nádrž.

Doplň mi ešte aktuálny zdroj tepla a približnú plochu domu, ak ju vieš.

### Turn 3

User: dom ma asi 120m
Pass: yes
responseTimeMs: 14129
answerMode: ai_fallback
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: deterministic_verdict
questionRoundsCount: 1
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: incomplete_answer_fallback
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory potreboval by som vybrat tepelne cerpadlo mam starsi dom, radiatory a chcem usetrit dom ma asi 120m
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory potreboval by som vybrat tepelne cerpadlo mam starsi dom, radiatory a chcem usetrit dom ma asi 120m
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":1}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"recommendation","property_type":"rodinný dom","area_m2":120}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Predbežný verdikt

Pri staršom alebo existujúcom dome s radiátormi pri dome cca 120 m² by som predbežne riešil tepelné čerpadlo **vzduch-voda vhodné pre radiátorový systém**. Dôležité je overiť, či radiátory vykúria dom aj pri nižšej teplote vody, alebo či bude treba upraviť časť vykurovania.

Pred finálnym návrhom treba poznať aktuálny zdroj tepla, zateplenie a aspoň orientačnú spotrebu alebo náhradný odhad.

Čím kúriš teraz a je dom zateplený?

### Turn 4

User: a znacka?
Pass: yes
responseTimeMs: 2247
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá brand_model scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer brand_model projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory potreboval by som vybrat tepelne cerpadlo mam starsi dom, radiatory a chcem usetrit dom ma asi 120m a znacka?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá brand_model scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer brand_model projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory potreboval by som vybrat tepelne cerpadlo mam starsi dom, radiatory a chcem usetrit dom ma asi 120m a znacka?
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"heat_pump_brands","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Značky tepelných čerpadiel

Pri **tepelných čerpadlách** viem bezpečne komunikovať hlavne **NIBE a Vaillant**. IVT by som bez aktuálneho potvrdenia bral ako neisté alebo na overenie.

Daikin a Mitsubishi by som pri TČ voda/voda alebo vzduch/voda nespomínal ako bežné portfólio, kým to firma nepotvrdí. Konkrétny model sa má vybrať až po návrhu podľa výkonu, radiátorov/podlahovky, teplej vody a kotolne.

### Turn 5

User: cize geotherm robi aj Daikin?
Pass: yes
responseTimeMs: 2120
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá brand_model scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer brand_model projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory potreboval by som vybrat tepelne cerpadlo mam starsi dom, radiatory a chcem usetrit dom ma asi 120m a znacka? cize geotherm robi aj Daikin?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá brand_model scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer brand_model projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory potreboval by som vybrat tepelne cerpadlo mam starsi dom, radiatory a chcem usetrit dom ma asi 120m a znacka? cize geotherm robi aj Daikin?
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"Daikin","last_brand_model_topic":"Daikin"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Daikin a tepelné čerpadlá

Pri **tepelných čerpadlách** by som Daikin bezpečne netvrdil ako bežné portfólio Geotherm, pokiaľ to nie je priamo potvrdené aktuálnymi firemnými pravidlami.

Bezpečne komunikovaný smer pre tepelné čerpadlá je **NIBE a Vaillant**. Mitsubishi sa môže objaviť skôr pri klimatizáciách alebo vzduch-vzduch riešeniach, nie ako hlavné portfólio TČ voda/voda alebo vzduch/voda.

### Turn 6

User: mne povedali ze robia iba NIBE a vaillant
Pass: yes
responseTimeMs: 1829
answerMode: correction_answer
serviceType: heat_pump
serviceIntent: complaint_or_correction
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, unsupported_heat_pump_brand_sanitized
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá complaint_or_correction scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer complaint_or_correction projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory mam starsi dom, radiatory a chcem usetrit dom ma asi 120m a znacka? cize geotherm robi aj Daikin? mne povedali ze robia iba NIBE a vaillant
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá complaint_or_correction scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer complaint_or_correction projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory mam starsi dom, radiatory a chcem usetrit dom ma asi 120m a znacka? cize geotherm robi aj Daikin? mne povedali ze robia iba NIBE a vaillant
storedSlots: {"service_type":"heat_pump","service_intent":"complaint_or_correction","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"brand_correction","last_brand_model_topic":"Daikin"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"complaint_or_correction"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Oprava k značkám

Áno, správne: pri **tepelných čerpadlách** mám bezpečne komunikovať hlavne **NIBE a Vaillant**.Pri tepelných čerpadlách viem bezpečne komunikovať NIBE a Vaillant; Daikin alebo Mitsubishi treba pri TČ potvrdiť podľa aktuálnej ponuky.

Daikin/Mitsubishi by som bez potvrdenia nespomínal pri TČ voda/voda alebo vzduch/voda; Mitsubishi môže patriť skôr ku klimatizáciám alebo vzduch-vzduch riešeniam.

### Turn 7

User: ake mate Vaillant?
Pass: yes
responseTimeMs: 2076
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá brand_model scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer brand_model projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory dom ma asi 120m a znacka? cize geotherm robi aj Daikin? mne povedali ze robia iba NIBE a vaillant ake mate Vaillant?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá brand_model scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer brand_model projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory dom ma asi 120m a znacka? cize geotherm robi aj Daikin? mne povedali ze robia iba NIBE a vaillant ake mate Vaillant?
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"Vaillant","last_brand_model_topic":"Vaillant"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Vaillant

Pri Vaillant riešeniach sa v knowledge spomínajú hlavne vzduch-voda riešenia ako aroTHERM plus a aroTHERM Split; vhodnosť závisí od domu.

Pre tvoj prípad (rekonštrukcia, 120 m², radiátory) by som to bral ako orientačný výber, nie finálny model. Pri tepelných čerpadlách je Vaillant spolu s NIBE bezpečná značka na komunikáciu, ale konkrétny model by som neoznačil za finálny bez návrhu výkonu, TÚV, hydrauliky a priestoru v kotolni.

### Turn 8

User: a split?
Pass: yes
responseTimeMs: 1824
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá brand_model scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer brand_model projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory a znacka? cize geotherm robi aj Daikin? mne povedali ze robia iba NIBE a vaillant ake mate Vaillant? a split?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá brand_model scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer brand_model projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory a znacka? cize geotherm robi aj Daikin? mne povedali ze robia iba NIBE a vaillant ake mate Vaillant? a split?
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"Vaillant Split","last_brand_model_topic":"Vaillant Split"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Vaillant Split

Ak myslíš **Vaillant aroTHERM Split**, je to splitové riešenie vzduch-voda; pri radiátoroch treba overiť hlavne potrebnú teplotu vody a výkon radiátorov.

Pre tvoj prípad (rekonštrukcia, 120 m², radiátory) by som to bral ako orientačný výber, nie finálny model. Pri tepelných čerpadlách je Vaillant spolu s NIBE bezpečná značka na komunikáciu, ale konkrétny model by som neoznačil za finálny bez návrhu výkonu, TÚV, hydrauliky a priestoru v kotolni.

### Turn 9

User: F2040 uz sa nevyraba
Pass: yes
responseTimeMs: 2277
answerMode: correction_answer
serviceType: heat_pump
serviceIntent: complaint_or_correction
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá complaint_or_correction scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer complaint_or_correction projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory cize geotherm robi aj Daikin? mne povedali ze robia iba NIBE a vaillant ake mate Vaillant? a split? F2040 uz sa nevyraba
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá complaint_or_correction scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer complaint_or_correction projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory cize geotherm robi aj Daikin? mne povedali ze robia iba NIBE a vaillant ake mate Vaillant? a split? F2040 uz sa nevyraba
storedSlots: {"service_type":"heat_pump","service_intent":"complaint_or_correction","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"F2040_obsolete","last_brand_model_topic":"Vaillant Split"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"complaint_or_correction"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Oprava k F2040

Máš pravdu, **F2040 by som nemal ponúkať ako aktuálny model pre novú realizáciu**. Ak sa nachádza v starších podkladoch alebo na webe, treba ho brať ako archívny/historický podklad, nie ako automatické odporúčanie.

Pre tvoj prípad by som riešil typovo **vzduch-voda riešenie pre radiátorový systém** a konkrétny aktuálny model vybral až podľa návrhu. Bezpečne sa držím značiek **NIBE alebo Vaillant**, ale aktuálnu dostupnosť konkrétneho modelu treba potvrdiť.

### Turn 10

User: A F2050?
Pass: yes
responseTimeMs: 1890
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá brand_model scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer brand_model projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory mne povedali ze robia iba NIBE a vaillant ake mate Vaillant? a split? F2040 uz sa nevyraba A F2050?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá brand_model scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer brand_model projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory mne povedali ze robia iba NIBE a vaillant ake mate Vaillant? a split? F2040 uz sa nevyraba A F2050?
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"F2050","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### NIBE F2050

Model **F2050** nemám potvrdený ako aktuálne komunikovaný model v firemnej pravde Geotherm, takže mu nebudem vymýšľať parametre ani ho odporúčať ako istú ponuku.

Bezpečný postup je držať sa typového riešenia: pre tvoj starší dom s radiátormi predbežne **vzduch-voda systém vhodný pre radiátory** a konkrétny aktuálny model vybrať až po návrhu. Z portfólia firmy viem pri tepelných čerpadlách bezpečne komunikovať najmä **NIBE a Vaillant**, ale aktuálnu dostupnosť konkrétneho modelu treba potvrdiť.

### Turn 11

User: ake su ceny vratane instalacie
Pass: yes
responseTimeMs: 2119
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá price scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer price projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory ake mate Vaillant? a split? F2040 uz sa nevyraba A F2050? ake su ceny vratane instalacie
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá price scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer price projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory ake mate Vaillant? a split? F2040 uz sa nevyraba A F2050? ake su ceny vratane instalacie
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"price","last_price_topic":"price","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Cena vrátane inštalácie

Presnú cenu bez konkrétnej ponuky nepotvrdím. Pri tepelnom čerpadle treba rozlíšiť cenu samotnej zostavy a cenu kompletnej realizácie.

Pri tvojom kontexte (Pre tvoj prípad (rekonštrukcia, 120 m², radiátory) by som to bral ako orientačný výber, nie finálny model) cenu ovplyvňuje výkon, radiátory alebo podlahovka, TÚV zásobník, regulácia, montážny materiál, úpravy kotolne, elektropráce, uvedenie do prevádzky a prípadná akumulačná nádrž.

Ak máš v ruke cenu, najdôležitejšie je porovnať rozsah: čo je zahrnuté, čo je príplatok a čo sa bude riešiť až po obhliadke alebo návrhu.

Jasné, ďalší krok je, aby sa vám vedel ozvať technik alebo obchodník a dohodol postup. Pošlite prosím telefón alebo e-mail, prípadne aj meno. Kontakt použijeme iba na spätné ozvanie k tomuto dopytu.

### Turn 12

User: 7tis je asi malo nie?
Pass: yes
responseTimeMs: 2178
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá price scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer price projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory a split? F2040 uz sa nevyraba A F2050? ake su ceny vratane instalacie 7tis je asi malo nie?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá price scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer price projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory a split? F2040 uz sa nevyraba A F2050? ake su ceny vratane instalacie 7tis je asi malo nie?
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"low_price_scope","last_price_topic":"low_price_scope","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### K cene 7 tisíc

Áno, **7 tisíc môže byť pri kompletnom tepelnom čerpadle podozrivo nízka suma**, najmä ak sa bavíme o staršom dome s radiátormi a výmenou kotla. Pri tvojom kontexte (Pre tvoj prípad (rekonštrukcia, 120 m², radiátory) by som to bral ako orientačný výber, nie finálny model) by som to nebral ako potvrdenú kompletnú cenu.

Treba presne overiť, čo je v tej sume: samotná zostava, montážny materiál, práca, regulácia, TÚV zásobník, akumulačná nádrž, elektropríprava, uvedenie do prevádzky a prípadné úpravy kotolne.

Jasné, ďalší krok je, aby sa vám vedel ozvať technik alebo obchodník a dohodol postup. Pošlite prosím telefón alebo e-mail, prípadne aj meno. Kontakt použijeme iba na spätné ozvanie k tomuto dopytu.

### Turn 13

User: potrebujem akumulacku, ci aj ta je v cene?
Pass: yes
responseTimeMs: 1975
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá price scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer price projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory F2040 uz sa nevyraba A F2050? ake su ceny vratane instalacie 7tis je asi malo nie? potrebujem akumulacku, ci aj ta je v cene?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá price scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer price projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory F2040 uz sa nevyraba A F2050? ake su ceny vratane instalacie 7tis je asi malo nie? potrebujem akumulacku, ci aj ta je v cene?
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"buffer_tank_price_scope","last_price_topic":"buffer_tank_price_scope","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Akumulačná nádrž a cena

**Neviem potvrdiť, že akumulačná nádrž je v cene**, pokiaľ to nie je priamo uvedené v konkrétnej ponuke. Pri radiátoroch alebo komplikovanejšej kotolni môže byť akumulačná nádrž potrebná, ale jej zahrnutie treba overiť v konkrétnom rozsahu ponuky.

Pri cene 7 tisíc by som obzvlášť overil, či ide iba o zariadenie/zostavu, alebo o kompletnú realizáciu vrátane montáže, regulácie, TÚV, akumulačnej nádrže, elektroprác a uvedenia do prevádzky.

Jasné, ďalší krok je, aby sa vám vedel ozvať technik alebo obchodník a dohodol postup. Pošlite prosím telefón alebo e-mail, prípadne aj meno. Kontakt použijeme iba na spätné ozvanie k tomuto dopytu.

### Turn 14

User: z coho?
Pass: yes
responseTimeMs: 2087
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá price scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer price projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory A F2050? ake su ceny vratane instalacie 7tis je asi malo nie? potrebujem akumulacku, ci aj ta je v cene? z coho?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá price scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer price projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory A F2050? ake su ceny vratane instalacie 7tis je asi malo nie? potrebujem akumulacku, ci aj ta je v cene? z coho?
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"price_basis","last_price_topic":"price_basis","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ bedeb5b

### Z čoho sa skladá cena

Myslím tým rozdiel medzi **cenou zariadenia** a **cenou kompletnej realizácie**. Kompletná cena môže zahŕňať tepelné čerpadlo, vnútorný modul alebo hydrauliku, reguláciu, montážny materiál, prácu, uvedenie do prevádzky, prípravu TÚV a podľa návrhu aj akumulačnú nádrž.

Preto sa nedá bezpečne povedať, že konkrétna suma platí pre celý systém, kým nie je jasné, čo presne ponuka obsahuje.

Jasné, ďalší krok je, aby sa vám vedel ozvať technik alebo obchodník a dohodol postup. Pošlite prosím telefón alebo e-mail, prípadne aj meno. Kontakt použijeme iba na spätné ozvanie k tomuto dopytu.
