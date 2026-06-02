# Diagnostic Conversation Test Report

Generated: 2026-06-02T06:47:37.907Z
Endpoint: http://127.0.0.1:55954/chat

Verdict: PASS
Failed turns: 0/44

## Novostavba + podlahovka + chladenie

### Turn 1

User: ahoj, ake cerpadlo je najlepsie?
Pass: yes
responseTimeMs: 3538
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
validatorsTriggered: inspection_claim_sanitized, initial_heat_pump_recommendation_repaired, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation ahoj, ake cerpadlo je najlepsie?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation ahoj, ake cerpadlo je najlepsie?
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","qualification_question_rounds":0}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom.
2. koľko m2 chceš vykurovať.
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: 1. novostavbu, 2. 120, 3. podlahovka
Pass: yes
responseTimeMs: 2577
answerMode: diagnostic_verdict
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 1
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie ahoj, ake cerpadlo je najlepsie? 1. novostavbu, 2. 120, 3. podlahovka
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie ahoj, ake cerpadlo je najlepsie? 1. novostavbu, 2. 120, 3. podlahovka
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"heating_distribution":"podlahové kúrenie","qualification_question_rounds":1}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Tepelné čerpadlo pre novostavbu s podlahovým kúrením

Keďže ide o novostavbu s podlahovým kúrením s plochou 120 m², predbežne sa ako najvhodnejšie riešenie javí **tepelné čerpadlo vzduch-voda**. Toto riešenie je efektívne, pretože podlahové kúrenie pracuje s nízkou teplotou vody, čo je pre tepelné čerpadlá ideálne.

Na presnejšie určenie optimálneho typu a výkonu tepelného čerpadla by som sa potreboval dozvedieť ešte pár detailov:

* Koľko osôb bude v domácnosti. (Pre dimenzovanie ohrevu teplej úžitkovej vody)
* Plánuješ v dome aj aktívne chladenie v lete?

### Turn 3

User: 1. 5, 2. ano
Pass: yes
responseTimeMs: 3639
answerMode: recommendation_closure
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: true
closureReason: question_budget_exhausted
recommendationOptions: ["Tepelné čerpadlo vzduch-voda pre nízkoteplotné podlahové kúrenie","Tepelné čerpadlo so zásobníkom TÚV podľa počtu osôb","Samostatne navrhnuté chladenie cez stropné chladenie, fancoily alebo klimatizáciu podľa projektu"]
remainingCriticalUnknowns: ["výkon a konkrétna zostava sa doriešia pri nacenení"]
validatorsTriggered: inspection_claim_sanitized, overconfident_wording_softened, recommendation_closure_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie ahoj, ake cerpadlo je najlepsie? 1. novostavbu, 2. 120, 3. podlahovka 1. 5, 2. ano
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie ahoj, ake cerpadlo je najlepsie? 1. novostavbu, 2. 120, 3. podlahovka 1. 5, 2. ano
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"heating_distribution":"podlahové kúrenie","wants_cooling":true,"occupants":5,"qualification_question_rounds":2,"recommendation_closure_offered":true}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežné uzavretie odporúčania

Podľa toho, čo píšeš, by som to už uzavrel: **najlepší smer je tepelné čerpadlo vzduch-voda pre novostavbu s nízkoteplotným podlahovým kúrením** pri dome približne 120 m², so zásobníkom TÚV dimenzovaným pre 5 osôb.

Dáva to zmysel preto, že podlahovka pracuje s nízkou teplotou vody a tepelnému čerpadlu to vyhovuje. Keďže chceš aj chladenie, nerátal by som automaticky s tým, že samotná podlahovka bude stačiť. Chladenie by som nacenil ako samostatný variant: stropné chladenie, fancoily alebo klimatizácia podľa toho, aký komfort v lete chceš.

**Pozrel by som sa na tieto možnosti:**
1. **Vaillant aroTHERM plus** ako moderné vzduch-voda riešenie pre podlahové kúrenie a TÚV.
2. **Vaillant aroTHERM Split** ako splitové riešenie, ak bude lepšie sedieť technickému umiestneniu.
3. **NIBE vzduch-voda riešenie, napríklad S2125**, ak bude podľa aktuálnej ponuky a konfigurácie vhodné pre dom.

Ďalší krok by som už nerobil ďalším dotazníkom. Dajme si krátku konzultáciu alebo stretnutie, kde sa vyberú 2-3 konkrétne zostavy, preverí sa TÚV a chladenie a pripraví sa nacenenie.

## Pozdrav + TČ + starší dom radiátory

### Turn 1

User: Ahoj, chcem tč
Pass: yes
responseTimeMs: 4096
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
validatorsTriggered: inspection_claim_sanitized, initial_heat_pump_recommendation_repaired, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation Ahoj, chcem tč
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation Ahoj, chcem tč
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","qualification_question_rounds":0}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom.
2. koľko m2 chceš vykurovať.
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: Starší 140m radiatory
Pass: yes
responseTimeMs: 7755
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
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory Ahoj, chcem tč Starší 140m radiatory
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory Ahoj, chcem tč Starší 140m radiatory
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","area_m2":140,"heating_distribution":"radiátory","qualification_question_rounds":1}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežný verdikt

Pri staršom alebo existujúcom dome s radiátormi pri dome cca 140 m² by som predbežne riešil tepelné čerpadlo **vzduch-voda vhodné pre radiátorový systém**. Dôležité je overiť, či radiátory vykúria dom aj pri nižšej teplote vody, alebo či bude treba upraviť časť vykurovania.

Pred finálnym návrhom treba poznať aktuálny zdroj tepla, zateplenie a aspoň orientačnú spotrebu alebo náhradný odhad.

Čím kúriš teraz a je dom zateplený?

## Starsi dom + radiatory + plyn + closure

### Turn 1

User: Ahoj, chcem tc
Pass: yes
responseTimeMs: 3109
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
validatorsTriggered: inspection_claim_sanitized, initial_heat_pump_recommendation_repaired, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation Ahoj, chcem tc
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation Ahoj, chcem tc
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","qualification_question_rounds":0}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom.
2. koľko m2 chceš vykurovať.
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: Starsi 140m radiatory
Pass: yes
responseTimeMs: 7443
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
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory Ahoj, chcem tc Starsi 140m radiatory
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory Ahoj, chcem tc Starsi 140m radiatory
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","area_m2":140,"heating_distribution":"radiátory","qualification_question_rounds":1}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežný verdikt

Pri staršom alebo existujúcom dome s radiátormi pri dome cca 140 m² by som predbežne riešil tepelné čerpadlo **vzduch-voda vhodné pre radiátorový systém**. Dôležité je overiť, či radiátory vykúria dom aj pri nižšej teplote vody, alebo či bude treba upraviť časť vykurovania.

Pred finálnym návrhom treba poznať aktuálny zdroj tepla, zateplenie a aspoň orientačnú spotrebu alebo náhradný odhad.

Čím kúriš teraz a je dom zateplený?

### Turn 3

User: plynovy kotol
Pass: yes
responseTimeMs: 3469
answerMode: recommendation_closure
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: true
closureReason: question_budget_exhausted
recommendationOptions: ["Tepelné čerpadlo vzduch-voda vhodné pre radiátorový systém","Úprava alebo posilnenie časti radiátorov, ak dom potrebuje vyššiu teplotu vody"]
remainingCriticalUnknowns: ["potrebná teplota vody pre radiátory","zateplenie domu","akumulačná nádrž alebo existujúce zapojenie kotolne","či má systém riešiť teplú vodu"]
validatorsTriggered: inspection_claim_sanitized, overconfident_wording_softened, recommendation_closure_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory aktuálne kúrenie plyn Ahoj, chcem tc Starsi 140m radiatory plynovy kotol
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory aktuálne kúrenie plyn Ahoj, chcem tc Starsi 140m radiatory plynovy kotol
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","area_m2":140,"current_heating":"plyn","heating_distribution":"radiátory","qualification_question_rounds":2,"recommendation_closure_offered":true}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežné uzavretie odporúčania

Podľa toho, čo píšeš, by som to už predbežne uzavrel: **najlepší smer je tepelné čerpadlo vzduch-voda vhodné pre radiátorový systém** pri dome približne 140 m² a náhrade zdroja typu plyn.

Dáva to zmysel, ale pri radiátoroch treba vyberať riešenie podľa požadovanej teploty vody. Ak sú radiátory dostatočne veľké, môže systém fungovať úsporne; ak sú poddimenzované, rieši sa ich posilnenie alebo vhodnejšia vysokoteplotná konfigurácia.

**Pozrel by som sa na tieto možnosti:**
1. **Vaillant aroTHERM plus** ako vzduch-voda riešenie vhodné aj pre radiátorové systémy, ak sadne výkon a zapojenie.
2. **NIBE S2125 alebo aktuálne NIBE vzduch-voda riešenie** podľa aktuálnej ponuky a požadovaného výkonu.
3. **Úprava hydrauliky alebo časti radiátorov**, ak dom potrebuje vyššiu teplotu vody alebo stabilnejší objem systému.

Typicky by sa riešila vonkajšia jednotka, vnútorné hydraulické zapojenie, regulácia, prípadne zásobník TÚV a akumulačná nádrž podľa kotolne.

Ďalší krok by už mala byť krátka konzultácia alebo stretnutie. Tam sa vyberú 2-3 konkrétne zostavy a pripraví sa nacenenie podľa radiátorov, kotolne a teplej vody.

### Turn 4

User: co odporucate?
Pass: yes
responseTimeMs: 3966
answerMode: recommendation_closure
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: true
closureReason: question_budget_exhausted
recommendationOptions: ["Tepelné čerpadlo vzduch-voda vhodné pre radiátorový systém","Úprava alebo posilnenie časti radiátorov, ak dom potrebuje vyššiu teplotu vody"]
remainingCriticalUnknowns: ["potrebná teplota vody pre radiátory","zateplenie domu","akumulačná nádrž alebo existujúce zapojenie kotolne","či má systém riešiť teplú vodu"]
validatorsTriggered: inspection_claim_sanitized, recommendation_followup_appended
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory aktuálne kúrenie plyn Ahoj, chcem tc Starsi 140m radiatory plynovy kotol co odporucate?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory aktuálne kúrenie plyn Ahoj, chcem tc Starsi 140m radiatory plynovy kotol co odporucate?
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","area_m2":140,"current_heating":"plyn","heating_distribution":"radiátory","qualification_question_rounds":2,"recommendation_closure_offered":true}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Recommendation closure gate je spustený. Teraz nesmieš pokračovať ďalším dotazníkom. Musíš dať uzatvorené predbežné odporúčanie: najlepší smer, dôvod, 2-3 konkrétne možnosti, typický rozsah riešenia a CTA na konzultáciu, stretnutie alebo nacenenie.

### Predbežné uzavretie odporúčania

Podľa toho, čo píšeš, by som to už predbežne uzavrel: **najlepší smer je tepelné čerpadlo vzduch-voda vhodné pre radiátorový systém** pri dome približne 140 m² a náhrade zdroja typu plyn.

Dáva to zmysel, ale pri radiátoroch treba vyberať riešenie podľa požadovanej teploty vody. Ak sú radiátory dostatočne veľké, môže systém fungovať úsporne; ak sú poddimenzované, rieši sa ich posilnenie alebo vhodnejšia vysokoteplotná konfigurácia.

**Pozrel by som sa na tieto možnosti:**
1. **Vaillant aroTHERM plus** ako vzduch-voda riešenie vhodné aj pre radiátorové systémy, ak sadne výkon a zapojenie.
2. **NIBE S2125 alebo aktuálne NIBE vzduch-voda riešenie** podľa aktuálnej ponuky a požadovaného výkonu.
3. **Úprava hydrauliky alebo časti radiátorov**, ak dom potrebuje vyššiu teplotu vody alebo stabilnejší objem systému.

Typicky by sa riešila vonkajšia jednotka, vnútorné hydraulické zapojenie, regulácia, prípadne zásobník TÚV a akumulačná nádrž podľa kotolne.

Ďalší krok by už mala byť krátka konzultácia alebo stretnutie. Tam sa vyberú 2-3 konkrétne zostavy a pripraví sa nacenenie podľa radiátorov, kotolne a teplej vody.

Ide skôr o výmenu zdroja kúrenia, servis existujúceho zariadenia, alebo návrh nového riešenia?

## Starší dom + radiátory + drevo

### Turn 1

User: ahoj, ake cerpadlo je najlepsie?
Pass: yes
responseTimeMs: 3883
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
validatorsTriggered: inspection_claim_sanitized, initial_heat_pump_recommendation_repaired, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation ahoj, ake cerpadlo je najlepsie?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation ahoj, ake cerpadlo je najlepsie?
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","qualification_question_rounds":0}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom.
2. koľko m2 chceš vykurovať.
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: starsi dom, 150m, mame radiatory
Pass: yes
responseTimeMs: 3276
answerMode: diagnostic_verdict
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 1
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":150,"heating_distribution":"radiátory","qualification_question_rounds":1}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Tepelné čerpadlo pre starší dom s radiátormi

Na základe toho, že ide o starší dom s rozlohou 150 m² a vykurovaním pomocou radiátorov, predbežne odporúčame tepelné čerpadlo **vzduch-voda**.

**Dôvod:** Tepelné čerpadlá vzduch-voda sú univerzálnym riešením, ktoré sa dá použiť aj pri rekonštrukcii starších domov. Pri radiátoroch je však kľúčové overiť, či sú schopné efektívne vykurovať dom pri nižšej teplote vody, ktorú tepelné čerpadlo dodáva. Ak sú radiátory menšie alebo dom potrebuje vyššiu teplotu vody, môže byť potrebná ich úprava alebo výmena.

**Typický rozsah riešenia:**
* Navrhneme tepelné čerpadlo vzduch-voda s dostatočným výkonom pre tvoju plochu.
* Posúdime súčasný stav radiátorov a ich vhodnosť pre spoluprácu s tepelným čerpadlom.
* Zabezpečíme kompletnú realizáciu od návrhu až po montáž.

**Čo potrebujeme vedieť ďalej:**
1. Aký je tvoj súčasný zdroj tepla (napr. plynový kotol, elektrické kúrenie).
2. Ako je dom zateplený?

### Turn 3

User: kotol mame drevom a netusim, mam vlastne drevo
Pass: yes
responseTimeMs: 4082
answerMode: recommendation_closure
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: true
closureReason: minimum_slots_plus_enough_context
recommendationOptions: ["Tepelné čerpadlo vzduch-voda ako hlavný zdroj kúrenia","Hybridné zapojenie: tepelné čerpadlo + ponechaný kotol na drevo ako záloha alebo doplnkový zdroj"]
remainingCriticalUnknowns: ["potrebná teplota vody pre radiátory","zateplenie domu","akumulačná nádrž alebo existujúce zapojenie kotolne","či má systém riešiť teplú vodu"]
validatorsTriggered: inspection_claim_sanitized, overconfident_wording_softened, recommendation_closure_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory aktuálne kúrenie tuhé palivo ročná spotreba nie je známa zákazník má vlastné drevo ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory kotol mame drevom a netusim, mam vlastne drevo
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory aktuálne kúrenie tuhé palivo ročná spotreba nie je známa zákazník má vlastné drevo ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory kotol mame drevom a netusim, mam vlastne drevo
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":150,"current_heating":"tuhé palivo","heating_distribution":"radiátory","annual_consumption_unknown":true,"own_wood":true,"qualification_question_rounds":2,"recommendation_closure_offered":true}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežné uzavretie odporúčania

Podľa toho, čo píšeš, by som to už predbežne uzavrel: **najlepší smer je tepelné čerpadlo vzduch-voda vhodné pre radiátorový systém** v staršom dome s plochou približne 150 m².

**Prečo:** máš radiátory, takže treba preveriť hlavne teplotu vody, ktorú dom potrebuje v zime. Keďže máš vlastné drevo, nehodnotil by som to iba cez úsporu. Ekonomiku treba overiť, ale hlavný prínos môže byť komfort: automatické kúrenie bez prikladania, menej práce s drevom a možnosť nechať drevo ako zálohu. Presná spotreba dreva nemusí byť pre prvý verdikt blokér; pri návrhu sa dá dopresniť.

**Reálne by som pozeral na dve možnosti:**
1. **Tepelné čerpadlo vzduch-voda ako hlavný zdroj kúrenia.** Vhodné, ak chceš čo najviac obmedziť prikladanie a mať automatickú prevádzku.
2. **Hybridné zapojenie: tepelné čerpadlo + ponechaný kotol na drevo ako záloha alebo doplnkový zdroj.** Vhodné, ak máš vlastné drevo a chceš ho občas využívať ako zálohu alebo doplnok.

Z portfólia firmy by dávalo zmysel pozrieť sa na vhodné riešenie od **NIBE alebo Vaillant** pre radiátorový systém, ale konkrétny model by sa vybral až podľa výkonu, radiátorov, kotolne a prípravy teplej vody.

Typicky by sa riešila vonkajšia jednotka, vnútorné hydraulické zapojenie, regulácia, prípadne zásobník TÚV, akumulačná nádrž alebo využitie existujúcej nádrže a napojenie na radiátorový systém.

Finálne treba preveriť hlavne teplotu vody pre radiátory, existujúcu akumulačnú nádrž, priestor v kotolni a či má čerpadlo riešiť aj teplú vodu.

Ďalší krok by som už nerobil ďalším dotazníkom. Dajme si krátku konzultáciu alebo stretnutie, kde sa preverí radiátorový systém, kotolňa a prípadná akumulačná nádrž a pripraví sa konkrétne nacenenie.

### Turn 4

User: 4m, zateplene vsetko
Pass: yes
responseTimeMs: 4826
answerMode: recommendation_closure
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: true
closureReason: minimum_slots_plus_enough_context
recommendationOptions: ["Tepelné čerpadlo vzduch-voda ako hlavný zdroj kúrenia","Hybridné zapojenie: tepelné čerpadlo + ponechaný kotol na drevo ako záloha alebo doplnkový zdroj"]
remainingCriticalUnknowns: ["potrebná teplota vody pre radiátory","akumulačná nádrž alebo existujúce zapojenie kotolne","či má systém riešiť teplú vodu"]
validatorsTriggered: none
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory aktuálne kúrenie tuhé palivo spotreba 4 m dreva za sezónu ročná spotreba nie je známa zákazník má vlastné drevo zateplenie zateplený alebo čiastočne zateplený ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory kotol mame drevom a netusim, mam vlastne drevo 4m, zateplene vsetko
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory aktuálne kúrenie tuhé palivo spotreba 4 m dreva za sezónu ročná spotreba nie je známa zákazník má vlastné drevo zateplenie zateplený alebo čiastočne zateplený ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory kotol mame drevom a netusim, mam vlastne drevo 4m, zateplene vsetko
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":150,"current_heating":"tuhé palivo","heating_distribution":"radiátory","insulation":"zateplený alebo čiastočne zateplený","annual_consumption":"4 m dreva za sezónu","annual_consumption_unknown":true,"own_wood":true,"qualification_question_rounds":2,"recommendation_closure_offered":true}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežné uzavretie odporúčania

Podľa toho, čo píšeš, by som to už predbežne uzavrel: **najlepší smer je tepelné čerpadlo vzduch-voda vhodné pre radiátorový systém** v staršom dome s plochou približne 150 m².

**Prečo:** máš radiátory, takže treba preveriť hlavne teplotu vody, ktorú dom potrebuje v zime. Keďže máš vlastné drevo a dom je zateplený, nehodnotil by som to iba cez úsporu. Ekonomiku treba overiť, ale hlavný prínos môže byť komfort: automatické kúrenie bez prikladania, menej práce s drevom a možnosť nechať drevo ako zálohu. Spotreba dreva (4m za sezónu) a zateplenie sú dobré informácie pre návrh.

**Reálne by som pozeral na dve možnosti:**
1. **Tepelné čerpadlo vzduch-voda ako hlavný zdroj kúrenia.** Vhodné, ak chceš čo najviac obmedziť prikladanie a mať automatickú prevádzku.
2. **Hybridné zapojenie: tepelné čerpadlo + ponechaný kotol na drevo ako záloha alebo doplnkový zdroj.** Vhodné, ak máš vlastné drevo a chceš ho občas využívať ako zálohu alebo doplnok.

Z portfólia firmy by dávalo zmysel pozrieť sa na vhodné riešenie od **NIBE alebo Vaillant** pre radiátorový systém, ale konkrétny model by sa vybral až podľa výkonu, radiátorov, kotolne a prípravy teplej vody.

Typicky by sa riešila vonkajšia jednotka, vnútorné hydraulické zapojenie, regulácia, prípadne zásobník TÚV, akumulačná nádrž alebo využitie existujúcej nádrže a napojenie na radiátorový systém.

Finálne treba preveriť hlavne teplotu vody pre radiátory, existujúcu akumulačnú nádrž, priestor v kotolni a či má čerpadlo riešiť aj teplú vodu.

Ďalší krok by som už nerobil ďalším dotazníkom. Dajme si krátku konzultáciu alebo stretnutie, kde sa preverí radiátorový systém, kotolňa a prípadná akumulačná nádrž a pripraví sa konkrétne nacenenie.

## TČ skratka + kvalifikacia uzavrie odporucanie

### Turn 1

User: aké máte tč?
Pass: yes
responseTimeMs: 2522
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, unsupported_heat_pump_brand_sanitized
retrievalQuery: company-truth brands NIBE Vaillant IVT Daikin Mitsubishi tepelné čerpadlá portfólio Geotherm
enrichedRetrievalQuery: company-truth brands NIBE Vaillant IVT Daikin Mitsubishi tepelné čerpadlá portfólio Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","qualification_question_rounds":0,"last_direct_topic":"heat_pump_brands","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Primárne sa zameriavame na značky NIBE a Vaillant. IVT spomíname opatrne, nakoľko jeho dostupnosť a vhodnosť treba vždy overiť podľa konkrétnej situácie a aktuálnej ponuky.Pri tepelných čerpadlách viem bezpečne komunikovať NIBE a Vaillant; Daikin alebo Mitsubishi treba pri TČ potvrdiť podľa aktuálnej ponuky.

Výber konkrétneho modelu tepelného čerpadla závisí od mnohých faktorov, ako je typ domu (novostavba/starší), či máte podlahové kúrenie alebo radiátory, a aké sú vaše požiadavky na ohrev vody.

### Turn 2

User: novostavbu 120m
Pass: yes
responseTimeMs: 3388
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
validatorsTriggered: inspection_claim_sanitized, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 aké máte tč? novostavbu 120m
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 aké máte tč? novostavbu 120m
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"qualification_question_rounds":0,"last_direct_topic":"heat_pump_brands","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Tepelné čerpadlo pre vašu novostavbu

Rozumiem, že riešiš novostavbu s plochou 120 m². To sú dobré základné informácie.

Pre novostavbu s podlahovým kúrením (predpokladám, že pri takejto ploche a novostavbe to tak bude) je najčastejšie vhodným riešením tepelné čerpadlo typu vzduch-voda. Toto riešenie je efektívne, pretože podlahové kúrenie pracuje s nízkou teplotou vody, čo tepelné čerpadlá zvládajú výborne.

Aby som ti vedel lepšie poradiť, potreboval by som vedieť ešte pár vecí:

* Máš v pláne aj chladenie, alebo len kúrenie a ohrev teplej vody.
* Koľko osôb bude v domácnosti? Toto je dôležité pre dimenzovanie ohrevu teplej vody.

Po zodpovedaní týchto otázok ti budem vedieť dať presnejší smer, aké riešenie by bolo pre teba najvhodnejšie. Následne by sme mohli dohodnúť obhliadku, kde by sme všetko detailne prekonzultovali a pripravili návrh.

### Turn 3

User: podlahovku
Pass: yes
responseTimeMs: 3160
answerMode: diagnostic_verdict
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 1
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized, hard_verdict_inserted
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie aké máte tč? novostavbu 120m podlahovku
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie aké máte tč? novostavbu 120m podlahovku
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"heating_distribution":"podlahové kúrenie","qualification_question_rounds":1,"last_direct_topic":"heat_pump_brands","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežný verdikt

Pre teba by som predbežne išiel do tepelného čerpadla **vzduch-voda** pre **novostavbu s nízkoteplotným podlahovým kúrením** pri dome cca 120 m². Dáva to zmysel hlavne preto, že podlahovka pracuje s nízkou teplotou vody, čo tepelnému čerpadlu vyhovuje.
Konkrétny výkon a model by som už riešil v nacenení, nie ďalším dotazníkom.

Koľko osôb bude v dome a chceš riešiť aj chladenie v lete?

### Turn 4

User: 5 osob, áno plánujem
Pass: yes
responseTimeMs: 3945
answerMode: recommendation_closure
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: true
closureReason: question_budget_exhausted
recommendationOptions: ["Tepelné čerpadlo vzduch-voda pre nízkoteplotné podlahové kúrenie","Tepelné čerpadlo so zásobníkom TÚV podľa počtu osôb","Samostatne navrhnuté chladenie cez stropné chladenie, fancoily alebo klimatizáciu podľa projektu"]
remainingCriticalUnknowns: ["výkon a konkrétna zostava sa doriešia pri nacenení"]
validatorsTriggered: inspection_claim_sanitized, recommendation_closure_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie aké máte tč? novostavbu 120m podlahovku 5 osob, áno plánujem
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie aké máte tč? novostavbu 120m podlahovku 5 osob, áno plánujem
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"heating_distribution":"podlahové kúrenie","wants_cooling":true,"occupants":5,"qualification_question_rounds":2,"recommendation_closure_offered":true,"last_direct_topic":"heat_pump_brands","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežné uzavretie odporúčania

Podľa toho, čo píšeš, by som to už uzavrel: **najlepší smer je tepelné čerpadlo vzduch-voda pre novostavbu s nízkoteplotným podlahovým kúrením** pri dome približne 120 m², so zásobníkom TÚV dimenzovaným pre 5 osôb.

Dáva to zmysel preto, že podlahovka pracuje s nízkou teplotou vody a tepelnému čerpadlu to vyhovuje. Keďže chceš aj chladenie, nerátal by som automaticky s tým, že samotná podlahovka bude stačiť. Chladenie by som nacenil ako samostatný variant: stropné chladenie, fancoily alebo klimatizácia podľa toho, aký komfort v lete chceš.

**Pozrel by som sa na tieto možnosti:**
1. **Vaillant aroTHERM plus** ako moderné vzduch-voda riešenie pre podlahové kúrenie a TÚV.
2. **Vaillant aroTHERM Split** ako splitové riešenie, ak bude lepšie sedieť technickému umiestneniu.
3. **NIBE vzduch-voda riešenie, napríklad S2125**, ak bude podľa aktuálnej ponuky a konfigurácie vhodné pre dom.

Ďalší krok by som už nerobil ďalším dotazníkom. Dajme si krátku konzultáciu alebo stretnutie, kde sa vyberú 2-3 konkrétne zostavy, preverí sa TÚV a chladenie a pripraví sa nacenenie.

## Klimatizácia do dvoch miestností

### Turn 1

User: chcem klimatizaciu do obyvacky a spalne
Pass: yes
responseTimeMs: 3146
answerMode: qualification_question
serviceType: air_conditioning
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized, followup_questions_limited
retrievalQuery: service router verdict gate service-card-air-conditioning klimatizacie klimatizácie recommendation scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod služba klimatizácie zámer recommendation rieši chladenie chcem klimatizaciu do obyvacky a spalne
enrichedRetrievalQuery: service router verdict gate service-card-air-conditioning klimatizacie klimatizácie recommendation scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod služba klimatizácie zámer recommendation rieši chladenie chcem klimatizaciu do obyvacky a spalne
storedSlots: {"service_type":"air_conditioning","service_intent":"recommendation","wants_cooling":true,"qualification_question_rounds":0}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Klimatizácia do obývačky a spálne

Rozumiem, chceš riešenie na chladenie obývačky a spálne. Klimatizácia je na to vhodná.

**Predbežný smer:**
Pre tieto dve miestnosti sa najčastejšie navrhuje buď samostatná jednotka do každej miestnosti, alebo jeden vonkajší modul s dvoma vnútornými jednotkami (tzv. multisplit systém). Výber závisí od dispozície bytu, možnosti umiestnenia vonkajšej jednotky a tvojich preferencií.

**Prečo toto riešenie:**
Samostatné jednotky poskytujú nezávislé ovládanie teploty v každej miestnosti. Multisplit systém je elegantnejší, zaberá menej miesta na fasáde a môže byť energeticky efektívnejší pri prevádzke oboch jednotiek súčasne.

**Čo potrebujeme vedieť ďalej:**
1. Aká je približná výmera obývačky a spálne.
2. Máš už predstavu, kde by mohli byť umiestnené vnútorné a vonkajšia jednotka?

Na základe týchto informácií ti vieme navrhnúť konkrétne riešenie a značku.

## Rekuperácia v novostavbe

### Turn 1

User: staviam dom a chcem lepsi vzduch bez otvarania okien
Pass: yes
responseTimeMs: 3322
answerMode: qualification_question
serviceType: heat_recovery
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-recovery rekuperacia vetranie rekuperácia recommendation služba rekuperácia zámer recommendation objekt rodinný dom staviam dom a chcem lepsi vzduch bez otvarania okien
enrichedRetrievalQuery: service router verdict gate service-card-heat-recovery rekuperacia vetranie rekuperácia recommendation služba rekuperácia zámer recommendation objekt rodinný dom staviam dom a chcem lepsi vzduch bez otvarania okien
storedSlots: {"service_type":"heat_recovery","service_intent":"recommendation","property_type":"rodinný dom","qualification_question_rounds":0}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Rekuperácia pre váš nový dom

Rozumiem, že pri stavbe nového domu myslíš na kvalitné vetranie a chceš mať doma svieži vzduch bez nutnosti otvárať okná. Rekuperácia je na to ideálne riešenie, pretože zabezpečuje neustálu výmenu vzduchu a zároveň minimalizuje tepelné straty.

**Prečo rekuperácia.**
* Zabezpečí čerstvý vzduch bez otvárania okien.
* Minimalizuje tepelné straty, čím šetrí energiu.
* Filtruje vzduch, čím zlepšuje jeho kvalitu.

**Čo potrebujeme vedieť ďalej:**
Keďže ide o novostavbu, je ideálne riešiť centrálnu rekuperáciu už v štádiu projektu, aby sa dali správne navrhnúť rozvody vzduchu.

Aby som ti mohol lepšie poradiť, potreboval by som vedieť ešte pár detailov:
1. Máš už hotový projekt domu.
2. Aká je približná úžitková plocha domu alebo počet miestností?

Na základe týchto informácií ti budeme vedieť navrhnúť optimálne riešenie.

## NIBE servisná chyba

### Turn 1

User: tepelne cerpadlo NIBE mi hlasi chybu
Pass: yes
responseTimeMs: 2452
answerMode: direct_answer
serviceType: service
serviceIntent: service_fault
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, service_fault_data_request_repaired, company_practical_guardrail_repaired
retrievalQuery: company-truth service chybovy kod displej znacka model lokalita Geotherm
enrichedRetrievalQuery: company-truth service chybovy kod displej znacka model lokalita Geotherm
storedSlots: {"service_type":"service","service_intent":"service_fault","qualification_question_rounds":0,"last_direct_topic":"error_code_service_scope"}
newlyExtractedSlots: {"service_type":"service","service_intent":"service_fault"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Chybové hlásenie zariadenia

Ak kotol, tepelné čerpadlo alebo iné zariadenie hlási chybu, neradil by som zásah do zariadenia naslepo. Najprv treba identifikovať značku, model, chybový kód, lokalitu a či zariadenie kúri alebo úplne stojí. Najlepší ďalší krok je poslať fotku displeja alebo štítku a kontakt, aby Geotherm potvrdil bezpečný servisný postup.

## Dotácie

### Turn 1

User: pomozete mi s dotaciou?
Pass: yes
responseTimeMs: 2441
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
validatorsTriggered: inspection_claim_sanitized, followup_questions_limited
retrievalQuery: service router verdict gate service-card-subsidy dotacie dotácie subsidy služba dotácie zámer subsidy pomozete mi s dotaciou?
enrichedRetrievalQuery: service router verdict gate service-card-subsidy dotacie dotácie subsidy služba dotácie zámer subsidy pomozete mi s dotaciou?
storedSlots: {"service_type":"subsidy","service_intent":"subsidy","qualification_question_rounds":0}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Pomoc s dotáciami

Jasné, s dotáciami ti vieme pomôcť. Naša firma asistuje pri vybavovaní dotácií na moderné technológie, ako sú tepelné čerpadlá či rekuperácia.

**Čo to znamená v praxi:**
* Pomôžeme ti zorientovať sa v aktuálnych možnostiach a podmienkach.
* Poradíme, aké zariadenia sú vhodné pre získanie dotácie.
* Sprevádzame ťa procesom, aby si mal istotu, že nič dôležité nezmeškáš.

Podmienky pre získanie dotácií sa často menia, preto je dôležité sledovať aktuálne programy.

Aby som ti mohol lepšie poradiť, potreboval by som vedieť pár vecí:
1. Aké konkrétne zariadenie by si chcel riešiť cez dotáciu (napr. tepelné čerpadlo, rekuperácia).
2. Ide o rodinný dom alebo iný typ objektu.
3. Ide o novú realizáciu alebo výmenu starého systému?

## Priame otazky na znacky, modely a ceny

### Turn 1

User: potreboval by som vybrat tepelne cerpadlo
Pass: yes
responseTimeMs: 2848
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
validatorsTriggered: inspection_claim_sanitized, initial_heat_pump_recommendation_repaired, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation potreboval by som vybrat tepelne cerpadlo
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation potreboval by som vybrat tepelne cerpadlo
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","qualification_question_rounds":0}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom.
2. koľko m2 chceš vykurovať.
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: mam starsi dom, radiatory a chcem usetrit
Pass: yes
responseTimeMs: 1891
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 1
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","heating_distribution":"radiátory","qualification_question_rounds":1,"last_direct_topic":"savings_roi_scope","last_price_topic":"savings_roi_scope"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","heating_distribution":"radiátory"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Pri staršom dome s radiátormi je úspora a návratnosť investície do tepelného čerpadla individuálna. Záleží od mnohých faktorov, ako je súčasná spotreba energie, cena paliva, stav zateplenia domu, výkon a typ tepelného čerpadla, ako aj celkové náklady na realizáciu.

Aby som ti mohol poskytnúť presnejšie informácie, potreboval by som vedieť, akým spôsobom sa v súčasnosti v dome kúri a aká je približná ročná spotreba energie na vykurovanie.

### Turn 3

User: dom ma asi 120m
Pass: yes
responseTimeMs: 2891
answerMode: rag_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 1
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá price scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer price projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory potreboval by som vybrat tepelne cerpadlo mam starsi dom, radiatory a chcem usetrit dom ma asi 120m
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá price scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer price projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory potreboval by som vybrat tepelne cerpadlo mam starsi dom, radiatory a chcem usetrit dom ma asi 120m
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":1,"last_direct_topic":"savings_roi_scope","last_price_topic":"savings_roi_scope"}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Tepelné čerpadlo pre starší dom s radiátormi

Rozumiem, že máš starší dom s radiátormi, chceš s ním ušetriť a má rozlohu približne 120 m². To sú dobré informácie na začiatok.

**Predbežný smer:**
Pre starší dom s radiátormi je často vhodným riešením tepelné čerpadlo vzduch-voda, ktoré dokáže pracovať aj s vyššou teplotou vody potrebnej pre radiátory. Je však dôležité overiť, či súčasné radiátory dokážu efektívne vykurovať dom pri nižšej teplote vody, ktorú tepelné čerpadlo primárne produkuje. V niektorých prípadoch môže byť potrebné radiátory upraviť alebo vymeniť.

**Čo treba overiť:**
* **Výkon radiátorov:** Je potrebné zistiť, či sú súčasné radiátory dostatočne veľké na to, aby vykúrili dom pri teplote vody, ktorú dokáže tepelné čerpadlo dodať.
* **Súčasný zdroj tepla a spotreba:** Aby sme mohli odhadnúť potenciálnu úsporu a návratnosť investície, potrebujeme vedieť, čím sa teraz kúri a aká je približná ročná spotreba energie.

**Ďalšie kroky:**
Aby som ti mohol lepšie poradiť s výberom konkrétneho typu tepelného čerpadla a odhadnúť cenu, potreboval by som vedieť ešte dve veci:
1. Akým zdrojom tepla kúriš teraz (napr. plyn, elektrina, tuhé palivo).
2. Aká je tvoja približná ročná spotreba energie na vykurovanie (v kWh alebo v jednotkách paliva, napr. m³ plynu)?

### Turn 4

User: a znacka?
Pass: yes
responseTimeMs: 2411
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
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth brands NIBE Vaillant IVT Daikin Mitsubishi tepelné čerpadlá portfólio Geotherm
enrichedRetrievalQuery: company-truth brands NIBE Vaillant IVT Daikin Mitsubishi tepelné čerpadlá portfólio Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"heat_pump_brands","last_price_topic":"savings_roi_scope","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Pri výbere značky tepelného čerpadla sa orientujeme predovšetkým na **NIBE a Vaillant**, ktoré máme overené v našom portfóliu. Značku IVT spomíname opatrne, jej vhodnosť a dostupnosť vždy overujeme podľa konkrétnej ponuky a vašej situácie. Ostatné značky ako Daikin či Mitsubishi pri tepelných čerpadlách aktívne neponúkame, pokiaľ to nie je explicitne potvrdené.

Výber konkrétneho modelu závisí od detailov vášho domu a systému vykurovania. Aké je vaše súčasné vykurovanie a aká je vaša ročná spotreba energie?

### Turn 5

User: cize geotherm robi aj Daikin?
Pass: yes
responseTimeMs: 2245
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 3
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, unsupported_brand_guardrail_repaired
retrievalQuery: company-truth brands Daikin tepelné čerpadlá klimatizácie Geotherm portfólio
enrichedRetrievalQuery: company-truth brands Daikin tepelné čerpadlá klimatizácie Geotherm portfólio
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":3,"last_direct_topic":"Daikin","last_price_topic":"savings_roi_scope","last_brand_model_topic":"Daikin"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Daikin a tepelné čerpadlá

Pri **tepelných čerpadlách** by som Daikin bezpečne netvrdil ako bežné portfólio Geotherm, pokiaľ to nie je priamo potvrdené aktuálnymi firemnými pravidlami.

Bezpečne komunikovaný smer pre tepelné čerpadlá je **NIBE a Vaillant**. Mitsubishi sa môže objaviť skôr pri klimatizáciách alebo vzduch-vzduch riešeniach, nie ako hlavné portfólio TČ voda/voda alebo vzduch/voda.

### Turn 6

User: mne povedali ze robia iba NIBE a vaillant
Pass: yes
responseTimeMs: 2209
answerMode: correction_answer
serviceType: heat_pump
serviceIntent: complaint_or_correction
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 3
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, unsupported_heat_pump_brand_sanitized, nibe_vaillant_context_followup_repaired
retrievalQuery: company-truth correction rules brands models obsolete F2040 NIBE Vaillant Daikin Mitsubishi direct answer
enrichedRetrievalQuery: company-truth correction rules brands models obsolete F2040 NIBE Vaillant Daikin Mitsubishi direct answer
storedSlots: {"service_type":"heat_pump","service_intent":"complaint_or_correction","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":3,"last_direct_topic":"brand_correction","last_price_topic":"savings_roi_scope","last_brand_model_topic":"Daikin"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"complaint_or_correction"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Áno, správne: pri **tepelných čerpadlách** mám bezpečne komunikovať hlavne **NIBE a Vaillant**.Pri tepelných čerpadlách viem bezpečne komunikovať NIBE a Vaillant; Daikin alebo Mitsubishi treba pri TČ potvrdiť podľa aktuálnej ponuky. Daikin/Mitsubishi by som bez potvrdenia nespomínal pri TČ voda/voda alebo vzduch/voda; Mitsubishi môže patriť skôr ku klimatizáciám alebo vzduch-vzduch riešeniam.

Riešiš servis existujúceho NIBE, výmenu za Vaillant, alebo nové nacenenie celého riešenia?

### Turn 7

User: ake mate Vaillant?
Pass: yes
responseTimeMs: 2537
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 3
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm
enrichedRetrievalQuery: company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":3,"last_direct_topic":"Vaillant","last_price_topic":"savings_roi_scope","last_brand_model_topic":"Vaillant"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Pri značke Vaillant sa v našom portfóliu zameriavame predovšetkým na vzduch-voda riešenia, ako sú modely aroTHERM plus a aroTHERM Split. Vhodnosť konkrétneho modelu závisí od špecifických podmienok vášho domu.

Pre váš prípad rekonštrukcie rodinného domu s rozlohou 120 m² a vykurovaním pomocou radiátorov je Vaillant spolu s NIBE bezpečnou voľbou. Presný model však nie je možné určiť bez detailnejšieho posúdenia výkonu, potreby teplej úžitkovej vody, hydrauliky a priestorových možností.

Chceli by ste sa poradiť ohľadom konkrétneho riešenia alebo rovno prejsť k naceneniu?

### Turn 8

User: a split?
Pass: yes
responseTimeMs: 1860
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 4
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm
enrichedRetrievalQuery: company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":4,"last_direct_topic":"Vaillant Split","last_price_topic":"savings_roi_scope","last_brand_model_topic":"Vaillant Split"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Áno, Vaillant aroTHERM Split je splitové riešenie vzduch-voda. Pri radiátoroch je dôležité overiť, či dokážu zabezpečiť dostatočný výkon pri nižšej výstupnej teplote vody, ktorú tepelné čerpadlo zvyčajne produkuje.

Pre váš dom (120 m², rekonštrukcia, radiátory) je to orientačný výber. Konkrétny model a jeho vhodnosť však závisí od detailného posúdenia vášho vykurovacieho systému a potrieb.

Chceli by ste sa poradiť ohľadom konkrétneho riešenia alebo rovno prejsť k naceneniu?

### Turn 9

User: F2040 uz sa nevyraba
Pass: yes
responseTimeMs: 2034
answerMode: correction_answer
serviceType: heat_pump
serviceIntent: complaint_or_correction
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 5
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, obsolete_f2040_claim_sanitized
retrievalQuery: company-truth correction rules brands models obsolete F2040 NIBE Vaillant Daikin Mitsubishi direct answer
enrichedRetrievalQuery: company-truth correction rules brands models obsolete F2040 NIBE Vaillant Daikin Mitsubishi direct answer
storedSlots: {"service_type":"heat_pump","service_intent":"complaint_or_correction","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":5,"last_direct_topic":"F2040_obsolete","last_price_topic":"savings_roi_scope","last_brand_model_topic":"Vaillant Split"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"complaint_or_correction"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

NIBE F2040 treba pri nových realizáciách brať ako neaktuálny alebo archívny podklad; aktuálny model treba potvrdiť podľa ponuky. Je to starší typ, ktorý sa už nevyrába. Pre nové riešenia sa zameriavame na aktuálne modely od značiek NIBE a Vaillant.

Pri rekonštrukcii vášho domu s radiátormi by sme sa zamerali na vzduch-voda tepelné čerpadlo. Konkrétny model by sme vybrali až po detailnom posúdení vášho vykurovacieho systému a potrieb.

### Turn 10

User: A F2050?
Pass: yes
responseTimeMs: 1968
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 5
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth product-facts NIBE F2050 aktuálne modely tepelné čerpadlá portfólio Geotherm
enrichedRetrievalQuery: company-truth product-facts NIBE F2050 aktuálne modely tepelné čerpadlá portfólio Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":5,"last_direct_topic":"F2050","last_price_topic":"savings_roi_scope","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Model NIBE F2050 nemám potvrdený ako aktuálne komunikovaný model v našej ponuke. Preto ho nebudem odporúčať ani uvádzať jeho parametre.

Pre váš starší dom s radiátormi je vhodný vzduch-voda systém, ale konkrétny model musíme vybrať až po detailnom posúdení vášho vykurovacieho systému a potrieb. Bezpečne vieme komunikovať najmä značky NIBE a Vaillant.

### Turn 11

User: ake su ceny vratane instalacie
Pass: yes
responseTimeMs: 2125
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 5
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":5,"last_direct_topic":"price","last_price_topic":"price","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Cenu kompletnej realizácie tepelného čerpadla vrátane inštalácie nie je možné stanoviť bez detailnej obhliadky a konkrétnej ponuky. Cena zahŕňa samotné zariadenie, montáž, hydraulické pripojenie, elektroinštaláciu, reguláciu, uvedenie do prevádzky a prípadné úpravy. Taktiež je potrebné zvážiť, či bude potrebný zásobník na teplú úžitkovú vodu alebo akumulačná nádrž.

Pre aký typ zdroja tepla uvažujete tepelné čerpadlo?

### Turn 12

User: 7tis je asi malo nie?
Pass: yes
responseTimeMs: 2015
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 6
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, buffer_tank_included_claim_sanitized, vague_price_followup_repaired, overconfident_wording_softened
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":6,"last_direct_topic":"low_price_scope","last_price_topic":"low_price_scope","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### K cene 7 tisíc

Áno, **7 tisíc môže byť pri kompletnom tepelnom čerpadle podozrivo nízka suma**, najmä ak sa bavíme o staršom dome s radiátormi a výmenou kotla. Pri tvojom kontexte (Pre tvoj prípad (rekonštrukcia, 120 m², radiátory) by som to bral ako orientačný výber, nie finálny model) by som to nebral ako potvrdenú kompletnú cenu.

Treba konkrétne overiť, čo je v tej sume: samotná zostava, montážny materiál, práca, regulácia, TÚV zásobník, akumulačná nádrž, elektropríprava, uvedenie do prevádzky a prípadné úpravy kotolne.

### Turn 13

User: potrebujem akumulacku, ci aj ta je v cene?
Pass: yes
responseTimeMs: 2580
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 6
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":6,"last_direct_topic":"buffer_tank_price_scope","last_price_topic":"buffer_tank_price_scope","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Neviem potvrdiť, či je akumulačná nádrž v cene, pokiaľ to nie je explicitne uvedené v konkrétnej ponuke. Pri starších domoch s radiátormi môže byť jej potreba reálna, ale jej zahrnutie do celkovej ceny treba vždy overiť. Pri sume 7 tisíc eur by som obzvlášť skontroloval, či ide o kompletnú realizáciu, alebo len o samotné zariadenie.

### Turn 14

User: z coho?
Pass: yes
responseTimeMs: 2201
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 6
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, buffer_tank_included_claim_sanitized, overconfident_wording_softened
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":6,"last_direct_topic":"price_basis","last_price_topic":"price_basis","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Cena sa zvyčajne skladá z ceny samotného zariadenia a ceny kompletnej realizácie. Tá druhá zahŕňa montáž, hydraulické pripojenie, elektroinštaláciu, reguláciu, uvedenie do prevádzky a prípadné úpravy.Akumulačná nádrž je v cene iba vtedy, keď je výslovne uvedená v konkrétnej ponuke; bez toho to treba overiť. Pri sume 7 tisíc eur je dôležité overiť, čo konkrétne ponuka obsahuje.

## Priama odpoved ostava AI a otaznik sa nerecykluje

### Turn 1

User: ahoj, ake TC mate?
Pass: yes
responseTimeMs: 1682
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth brands NIBE Vaillant IVT Daikin Mitsubishi tepelné čerpadlá portfólio Geotherm
enrichedRetrievalQuery: company-truth brands NIBE Vaillant IVT Daikin Mitsubishi tepelné čerpadlá portfólio Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","qualification_question_rounds":0,"last_direct_topic":"heat_pump_brands","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Ponúkame tepelné čerpadlá značiek NIBE a Vaillant. IVT spomíname opatrne, nakoľko dostupnosť a vhodnosť konkrétneho modelu treba vždy overiť podľa špecifikácií vášho domu a aktuálnej ponuky.

Aby som vám mohol lepšie poradiť, potreboval by som vedieť, či ide o novostavbu alebo starší dom a či máte v dome podlahové kúrenie alebo radiátory.

### Turn 2

User: ?
Pass: yes
responseTimeMs: 2180
answerMode: direct_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, direct_clarification_repaired
retrievalQuery: company-truth direct answer clarification heat_pump_brands tepelné čerpadlá Geotherm
enrichedRetrievalQuery: company-truth direct answer clarification heat_pump_brands tepelné čerpadlá Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","qualification_question_rounds":0,"last_direct_topic":"clarification","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Upresnenie

Myslel som tým: pri tepelných čerpadlách viem ako bezpečné firemné portfólio komunikovať hlavne NIBE a Vaillant. To ešte nie je výber vhodného čerpadla pre tvoj dom.

Ak chceš, aby som odporučil smer pre teba, napíš mi, či ide o novostavbu alebo starší dom a či máš radiátory alebo podlahovku.

## Cena a znacky sa neprenasaju do dalsich otazok

### Turn 1

User: Ahoj, chcem tc
Pass: yes
responseTimeMs: 3745
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
validatorsTriggered: inspection_claim_sanitized, initial_heat_pump_recommendation_repaired, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation Ahoj, chcem tc
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation Ahoj, chcem tc
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","qualification_question_rounds":0}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom.
2. koľko m2 chceš vykurovať.
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: Starsi 140m radiatory
Pass: yes
responseTimeMs: 3730
answerMode: diagnostic_verdict
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 1
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory Ahoj, chcem tc Starsi 140m radiatory
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory Ahoj, chcem tc Starsi 140m radiatory
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","area_m2":140,"heating_distribution":"radiátory","qualification_question_rounds":1}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Tepelné čerpadlo pre rekonštrukciu s radiátormi

Rozumiem, že ide o starší dom s rozlohou 140 m² a vykurovaním pomocou radiátorov. V takomto prípade je predbežný smer výber tepelného čerpadla vzduch-voda, ktoré je vhodné aj pre existujúce systémy s radiátormi.

**Dôvod:** Tepelné čerpadlá vzduch-voda sú univerzálne a dajú sa nainštalovať takmer kdekoľvek. Pri radiátoroch je však kľúčové overiť, či sú schopné dodať dostatočný výkon pri nižšej teplote vody, ktorú tepelné čerpadlo preferuje.

**Typický rozsah riešenia:**
* Navrhneme tepelné čerpadlo vzduch-voda s výkonom prispôsobeným vašej ploche a potrebám.
* Overíme kompatibilitu vašich súčasných radiátorov s prevádzkou tepelného čerpadla. V niektorých prípadoch môže byť potrebné vymeniť staršie radiátory za efektívnejšie, alebo pridať nové.
* Zabezpečíme kompletnú realizáciu od návrhu až po montáž.

Aby som ti mohol čo najlepšie poradiť a pripraviť návrh, potreboval by som ešte vedieť:
1. Aký je váš súčasný zdroj tepla (napr. plynový kotol, elektrické kúrenie).
2. Plánujete v blízkej budúcnosti zatepľovať dom alebo meniť okná?

### Turn 3

User: chcem Vaillant ale mam NIBE
Pass: yes
responseTimeMs: 2989
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
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm
enrichedRetrievalQuery: company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","area_m2":140,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"Vaillant","last_brand_model_topic":"Vaillant"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Rozumiem, že máš existujúce tepelné čerpadlo značky NIBE a teraz zvažuješ značku Vaillant. Ak ide o výmenu alebo nové riešenie, je dôležité si uvedomiť, že Vaillant patrí spolu s NIBE k značkám, s ktorými Geotherm bežne pracuje a sú považované za spoľahlivé.

Pre tvoj prípad rekonštrukcie staršieho domu s radiátormi a plochou 140 m² by bolo ideálne najprv vykonať odbornú konzultáciu. Táto konzultácia by pomohla overiť stav tvojho súčasného systému NIBE, zistiť dôvody zvažovanej zmeny a pripraviť porovnanie s novým riešením od Vaillant.

Aký je hlavný dôvod, prečo uvažuješ o zmene značky z NIBE na Vaillant?

### Turn 4

User: daj mi presnu cenu
Pass: yes
responseTimeMs: 2054
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 3
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, overconfident_wording_softened, sensitive_price_scope_repaired
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","area_m2":140,"heating_distribution":"radiátory","qualification_question_rounds":3,"last_direct_topic":"price","last_price_topic":"price","last_brand_model_topic":"Vaillant"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Konkrétnu cenu bez údajov o dome a rozsahu prác nebudem hádať.

Pri nacenení treba rozlíšiť cenu zariadenia a kompletnej realizácie: výkon, typ vykurovania, montáž, reguláciu, TÚV, elektroprípravu, prípadnú akumulačnú nádrž a úpravy kotolne. Najlepší ďalší krok je krátka konzultácia s Geotherm, kde sa rozsah nacení podľa domu.

### Turn 5

User: opravite to alebo treba montaz?
Pass: yes
responseTimeMs: 2269
answerMode: direct_answer
serviceType: heat_pump
serviceIntent: service_fault
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 3
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, service_fault_data_request_repaired, repair_or_installation_followup_repaired, service_fault_followup_appended
retrievalQuery: company-truth servis montaz oprava nove riesenie cena termin Geotherm
enrichedRetrievalQuery: company-truth servis montaz oprava nove riesenie cena termin Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"service_fault","project_type":"rekonštrukcia","area_m2":140,"heating_distribution":"radiátory","qualification_question_rounds":3,"last_direct_topic":"repair_or_installation_followup","last_price_topic":"price","last_brand_model_topic":"Vaillant"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"service_fault"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

### Servisný smer

Rozumiem, zariadenie hlási chybu. Pri poruche by som neradil žiadny svojpomocný zásah do zariadenia; najprv treba zistiť presný model, chybový kód a lokalitu, aby sa dalo posúdiť, či ide o servisný zásah a aký postup je bezpečný.

Pri zariadeniach montovaných inou firmou treba dostupnosť servisu potvrdiť podľa značky a prípadu.

Pošli mi prosím model alebo fotku štítku, chybový kód z displeja a mesto, kde je zariadenie.

Ide o existujúce zariadenie s poruchou, pravidelný servis, alebo zvažuješ výmenu za nové riešenie?

### Turn 6

User: ahoj
Pass: yes
responseTimeMs: 1755
answerMode: general_chat
serviceType: unknown
serviceIntent: general
sourcesCount: 0
fallbackType: n/a
questionRoundsCount: 3
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized, overconfident_wording_softened, pure_small_talk_compacted
retrievalQuery: ahoj
enrichedRetrievalQuery: ahoj
storedSlots: {"service_type":"heat_pump","service_intent":"service_fault","project_type":"rekonštrukcia","area_m2":140,"heating_distribution":"radiátory","qualification_question_rounds":3,"last_direct_topic":"repair_or_installation_followup","last_price_topic":"price","last_brand_model_topic":"Vaillant"}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

Ahoj, som tu.

### Turn 7

User: cena?
Pass: yes
responseTimeMs: 2335
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 3
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, overconfident_wording_softened
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","area_m2":140,"heating_distribution":"radiátory","qualification_question_rounds":3,"last_direct_topic":"price","last_price_topic":"price","last_brand_model_topic":"Vaillant"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ b07d3ce

konkrétnu cenu bez konkrétnej ponuky nepotvrdím. Pri tepelnom čerpadle treba rozlíšiť cenu samotnej zostavy a cenu kompletnej realizácie.

Pre tvoj prípad (rekonštrukcia, 140 m², radiátory) cenu ovplyvňuje výkon, typ rozvodov tepla, zásobník TÚV, regulácia, montážny materiál, elektropráce a prípadné úpravy kotolne.

Ide o nové tepelné čerpadlo, výmenu starého zdroja, alebo servis existujúceho zariadenia?
