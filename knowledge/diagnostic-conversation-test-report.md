# Diagnostic Conversation Test Report

Generated: 2026-06-01T23:19:18.410Z
Endpoint: http://127.0.0.1:51651/chat

Verdict: PASS
Failed turns: 0/43

## Novostavba + podlahovka + chladenie

### Turn 1

User: ahoj, ake cerpadlo je najlepsie?
Pass: yes
responseTimeMs: 3036
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom.
2. koľko m2 chceš vykurovať.
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: 1. novostavbu, 2. 120, 3. podlahovka
Pass: yes
responseTimeMs: 2616
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Odporúčanie pre novostavbu s podlahovým kúrením

Keďže ide o novostavbu s plochou 120 m² a podlahovým kúrením, predbežne sa ako najvhodnejšie riešenie javí **tepelné čerpadlo vzduch-voda**. Tento typ je ideálny pre nízkoteplotné vykurovacie systémy, akým je práve podlahovka, a je použiteľný takmer pri všetkých typoch stavieb.

Aby som ti mohol odporučiť konkrétnejší model a zistiť všetky potrebné detaily, potreboval by som ešte vedieť:

* Koľko osôb bude v dome bývať (kvôli potrebnému množstvu teplej vody).
* Potrebuješ aj riešenie na chladenie v lete?

### Turn 3

User: 1. 5, 2. ano
Pass: yes
responseTimeMs: 3435
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

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
responseTimeMs: 3255
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom.
2. koľko m2 chceš vykurovať.
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: Starší 140m radiatory
Pass: yes
responseTimeMs: 2792
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
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory Ahoj, chcem tč Starší 140m radiatory
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory Ahoj, chcem tč Starší 140m radiatory
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","area_m2":140,"heating_distribution":"radiátory","qualification_question_rounds":1}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Tepelné čerpadlo pre starší dom s radiátormi

Rozumiem, ide o rekonštrukciu staršieho domu s plochou 140 m² a vykurovaním pomocou radiátorov. V takomto prípade je predbežný smer **tepelné čerpadlo vzduch-voda**.

**Dôvod:** Tepelné čerpadlá vzduch-voda sú univerzálne a vhodné aj pre staršie domy s existujúcimi radiátormi. Je však dôležité overiť, či súčasné radiátory dokážu efektívne vykurovať dom pri nižšej teplote vody, ktorú tepelné čerpadlo produkuje.

**Typický rozsah riešenia:**
* Navrhneme vhodné tepelné čerpadlo vzduch-voda s potrebným výkonom.
* Posúdime stav a veľkosť vašich radiátorov. V niektorých prípadoch môže byť potrebné vymeniť alebo doplniť radiátory, aby systém fungoval optimálne.
* Zabezpečíme kompletnú montáž a uvedenie do prevádzky.

**Čo potrebujeme vedieť ďalej:**
1. Aký je váš súčasný zdroj tepla (napr. plynový kotol, elektrické kúrenie).
2. Máte záujem aj o ohrev teplej úžitkovej vody (TÚV) tepelným čerpadlom?

Na základe týchto informácií ti budem vedieť poskytnúť presnejšie odporúčanie a pripraviť návrh riešenia.

## Starsi dom + radiatory + plyn + closure

### Turn 1

User: Ahoj, chcem tc
Pass: yes
responseTimeMs: 3507
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom.
2. koľko m2 chceš vykurovať.
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: Starsi 140m radiatory
Pass: yes
responseTimeMs: 4323
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Tepelné čerpadlo pre starší dom s radiátormi

Pre starší dom s 140 m² a radiátormi je predbežným smerom tepelné čerpadlo vzduch-voda. Je dôležité overiť, či vaše súčasné radiátory dokážu efektívne vykurovať dom pri nižšej teplote vody, ktorú tepelné čerpadlo dodáva. V niektorých prípadoch môže byť potrebné upraviť alebo vymeniť časť radiátorov, aby systém fungoval optimálne.

Aby som ti mohol presnejšie poradiť, potreboval by som vedieť:
* Aký je váš súčasný zdroj tepla (napr. plynový kotol, elektrické kúrenie).
* Aká je približná ročná spotreba energie na kúrenie?

### Turn 3

User: plynovy kotol
Pass: yes
responseTimeMs: 2494
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
validatorsTriggered: hard_verdict_inserted
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory aktuálne kúrenie plyn Ahoj, chcem tc Starsi 140m radiatory plynovy kotol
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory aktuálne kúrenie plyn Ahoj, chcem tc Starsi 140m radiatory plynovy kotol
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","area_m2":140,"current_heating":"plyn","heating_distribution":"radiátory","qualification_question_rounds":2}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Predbežný verdikt

Pri staršom alebo existujúcom dome s radiátormi pri dome cca 140 m² by som predbežne riešil tepelné čerpadlo **vzduch-voda vhodné pre radiátorový systém**. Dôležité je overiť, či radiátory vykúria dom aj pri nižšej teplote vody, alebo či bude treba upraviť časť vykurovania.

Pred finálnym návrhom treba poznať aktuálny zdroj tepla, zateplenie a aspoň orientačnú spotrebu alebo náhradný odhad.

Čím kúriš teraz a je dom zateplený?

### Turn 4

User: co odporucate?
Pass: yes
responseTimeMs: 3870
answerMode: recommendation_closure
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 3
closureGateTriggered: true
closureReason: question_budget_exhausted
recommendationOptions: ["Tepelné čerpadlo vzduch-voda vhodné pre radiátorový systém","Úprava alebo posilnenie časti radiátorov, ak dom potrebuje vyššiu teplotu vody"]
remainingCriticalUnknowns: ["potrebná teplota vody pre radiátory","zateplenie domu","akumulačná nádrž alebo existujúce zapojenie kotolne","či má systém riešiť teplú vodu"]
validatorsTriggered: inspection_claim_sanitized, recommendation_closure_repaired, recommendation_followup_appended
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory aktuálne kúrenie plyn Ahoj, chcem tc Starsi 140m radiatory plynovy kotol co odporucate?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia plocha 140 m2 vykurovanie radiátory aktuálne kúrenie plyn Ahoj, chcem tc Starsi 140m radiatory plynovy kotol co odporucate?
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","area_m2":140,"current_heating":"plyn","heating_distribution":"radiátory","qualification_question_rounds":3,"recommendation_closure_offered":true}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

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
responseTimeMs: 2397
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom.
2. koľko m2 chceš vykurovať.
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: starsi dom, 150m, mame radiatory
Pass: yes
responseTimeMs: 2607
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Tepelné čerpadlo pre starší dom s radiátormi

Na základe toho, že ide o starší dom s rozlohou 150 m² a vykurovaním pomocou radiátorov, predbežne odporúčam tepelné čerpadlo typu **vzduch-voda**.

**Dôvod:** Tepelné čerpadlá vzduch-voda sú univerzálnym riešením, ktoré sa dá použiť aj pri rekonštrukcii staršieho domu. Vzhľadom na to, že máš radiátory, je kľúčové overiť, či sú schopné efektívne vykurovať dom pri nižšej teplote vody, ktorú tepelné čerpadlo dodáva.

**Typický rozsah riešenia:** V takomto prípade sa zameriavame na výber tepelného čerpadla s dostatočným výkonom pre tvoju plochu a s ohľadom na potrebu vyššej teploty vody pre radiátory. Je možné, že bude potrebné preveriť aj veľkosť a stav radiátorov, prípadne ich doplniť alebo vymeniť niektoré kusy, aby systém fungoval optimálne.

Aby som ti vedel poradiť konkrétnejšie, potreboval by som vedieť ešte pár vecí:
* Akým zdrojom tepla kúriš teraz a aká je tvoja približná ročná spotreba energie (napr. kWh plynu, elektriny).
* Je dom zateplený, alebo ide o nezateplený starší dom?

### Turn 3

User: kotol mame drevom a netusim, mam vlastne drevo
Pass: yes
responseTimeMs: 3516
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
validatorsTriggered: inspection_claim_sanitized, hard_verdict_inserted
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory aktuálne kúrenie tuhé palivo ročná spotreba nie je známa zákazník má vlastné drevo ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory kotol mame drevom a netusim, mam vlastne drevo
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory aktuálne kúrenie tuhé palivo ročná spotreba nie je známa zákazník má vlastné drevo ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory kotol mame drevom a netusim, mam vlastne drevo
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":150,"current_heating":"tuhé palivo","heating_distribution":"radiátory","annual_consumption_unknown":true,"own_wood":true,"qualification_question_rounds":2}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Predbežný verdikt

Podľa toho, čo píšeš, ide predbežne o výmenu kotla na drevo alebo tuhé palivo za tepelné čerpadlo **vzduch-voda vhodné pre radiátorový systém** pri dome cca 150 m². Dôvod je, že radiátory často potrebujú vyššiu teplotu vody než podlahovka, takže treba overiť výkon radiátorov a tepelné straty domu.

Typicky by sa riešilo tepelné čerpadlo, úprava kotolne, regulácia, prípadne akumulačná nádrž a ohrev teplej vody. Keďže pri dreve býva spotreba nepresná, stačí orientačne koľko dreva spáliš za sezónu.

Je dom zateplený a máš už v systéme akumulačnú nádrž?

### Turn 4

User: 4m, zateplene vsetko
Pass: yes
responseTimeMs: 5086
answerMode: recommendation_closure
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 3
closureGateTriggered: true
closureReason: minimum_slots_plus_enough_context
recommendationOptions: ["Tepelné čerpadlo vzduch-voda ako hlavný zdroj kúrenia","Hybridné zapojenie: tepelné čerpadlo + ponechaný kotol na drevo ako záloha alebo doplnkový zdroj"]
remainingCriticalUnknowns: ["potrebná teplota vody pre radiátory","akumulačná nádrž alebo existujúce zapojenie kotolne","či má systém riešiť teplú vodu"]
validatorsTriggered: inspection_claim_sanitized, recommendation_closure_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory aktuálne kúrenie tuhé palivo spotreba 4 m dreva za sezónu ročná spotreba nie je známa zákazník má vlastné drevo zateplenie zateplený alebo čiastočne zateplený ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory kotol mame drevom a netusim, mam vlastne drevo 4m, zateplene vsetko
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody scenar-vymena-kotla-na-drevo tuhe palivo radiatory akumulacna nadrz tepelne cerpadlo vzduch-voda služba tepelné čerpadlá zámer recommendation projekt rekonštrukcia objekt rodinný dom plocha 150 m2 vykurovanie radiátory aktuálne kúrenie tuhé palivo spotreba 4 m dreva za sezónu ročná spotreba nie je známa zákazník má vlastné drevo zateplenie zateplený alebo čiastočne zateplený ahoj, ake cerpadlo je najlepsie? starsi dom, 150m, mame radiatory kotol mame drevom a netusim, mam vlastne drevo 4m, zateplene vsetko
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":150,"current_heating":"tuhé palivo","heating_distribution":"radiátory","insulation":"zateplený alebo čiastočne zateplený","annual_consumption":"4 m dreva za sezónu","annual_consumption_unknown":true,"own_wood":true,"qualification_question_rounds":3,"recommendation_closure_offered":true}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Predbežné uzavretie odporúčania

Podľa toho, čo píšeš, by som to už predbežne uzavrel: **najlepší smer je tepelné čerpadlo vzduch-voda vhodné pre radiátorový systém** v zateplenom staršom dome s plochou približne 150 m².

**Prečo:** máš radiátory a dom je zateplený, takže šanca na funkčné riešenie je výrazne lepšia než pri nezateplenom dome. Keďže máš vlastné drevo, nehodnotil by som to iba cez úsporu. Ekonomiku treba overiť, ale hlavný prínos môže byť komfort: automatické kúrenie bez prikladania, menej práce s drevom a možnosť nechať drevo ako zálohu. Beriem údaj **4 m dreva za sezónu** ako orientačnú spotrebu dreva za sezónu. Ak je jednotka iná, pri návrhu sa to jednoducho spresní.

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
responseTimeMs: 2254
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
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, unsupported_heat_pump_brand_sanitized, followup_questions_limited
retrievalQuery: company-truth brands NIBE Vaillant IVT Daikin Mitsubishi tepelné čerpadlá portfólio Geotherm
enrichedRetrievalQuery: company-truth brands NIBE Vaillant IVT Daikin Mitsubishi tepelné čerpadlá portfólio Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","qualification_question_rounds":0,"last_direct_topic":"heat_pump_brands","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Ponúkame tepelné čerpadlá značiek NIBE a Vaillant. IVT spomíname opatrne, nakoľko dostupnosť a vhodnosť konkrétneho modelu treba vždy overiť podľa špecifikácií vášho domu a aktuálnej ponuky.Pri tepelných čerpadlách viem bezpečne komunikovať NIBE a Vaillant; Daikin alebo Mitsubishi treba pri TČ potvrdiť podľa aktuálnej ponuky.

Pre výber vhodného tepelného čerpadla je kľúčové najprv zhodnotiť váš dom. Je to novostavba alebo starší dom. Aký typ vykurovania preferujete – radiátory alebo podlahové kúrenie?

### Turn 2

User: novostavbu 120m
Pass: yes
responseTimeMs: 2394
answerMode: qualification_question
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
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 aké máte tč? novostavbu 120m
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 aké máte tč? novostavbu 120m
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"qualification_question_rounds":1,"last_direct_topic":"heat_pump_brands","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Tepelné čerpadlo pre vašu novostavbu

Super, ďakujem za upresnenie. Keďže ide o novostavbu s plochou 120 m², predbežne by som odporúčal tepelné čerpadlo typu vzduch-voda. Tento typ je ideálny pre nízkoteplotné vykurovacie systémy, ktoré sú bežné v moderných novostavbách, najmä ak plánuješ podlahové kúrenie.

Aby som ti mohol čo najlepšie poradiť, potreboval by som vedieť ešte pár detailov:

* Plánuješ v dome aj podlahové kúrenie, alebo budeš používať radiátory.
* Bude tepelné čerpadlo slúžiť len na vykurovanie, alebo by si chcel aj ohrev teplej úžitkovej vody a prípadne aj chladenie v lete?

### Turn 3

User: podlahovku
Pass: yes
responseTimeMs: 2101
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
validatorsTriggered: inspection_claim_sanitized, new_build_followup_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie aké máte tč? novostavbu 120m podlahovku
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie aké máte tč? novostavbu 120m podlahovku
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"heating_distribution":"podlahové kúrenie","qualification_question_rounds":2,"last_direct_topic":"heat_pump_brands","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Predbežný verdikt

Pre teba by som predbežne išiel do tepelného čerpadla **vzduch-voda** pre **novostavbu s nízkoteplotným podlahovým kúrením** pri dome cca 120 m². Dáva to zmysel hlavne preto, že podlahovka pracuje s nízkou teplotou vody, čo tepelnému čerpadlu vyhovuje.
Konkrétny výkon a model by som už riešil v nacenení, nie ďalším dotazníkom.

Koľko osôb bude v dome a chceš riešiť aj chladenie v lete?

### Turn 4

User: 5 osob, áno plánujem
Pass: yes
responseTimeMs: 3782
answerMode: recommendation_closure
serviceType: heat_pump
serviceIntent: recommendation
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 3
closureGateTriggered: true
closureReason: question_budget_exhausted
recommendationOptions: ["Tepelné čerpadlo vzduch-voda pre nízkoteplotné podlahové kúrenie","Tepelné čerpadlo so zásobníkom TÚV podľa počtu osôb","Samostatne navrhnuté chladenie cez stropné chladenie, fancoily alebo klimatizáciu podľa projektu"]
remainingCriticalUnknowns: ["výkon a konkrétna zostava sa doriešia pri nacenení"]
validatorsTriggered: inspection_claim_sanitized, recommendation_closure_repaired
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie aké máte tč? novostavbu 120m podlahovku 5 osob, áno plánujem
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie aké máte tč? novostavbu 120m podlahovku 5 osob, áno plánujem
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"heating_distribution":"podlahové kúrenie","wants_cooling":true,"occupants":5,"qualification_question_rounds":3,"recommendation_closure_offered":true,"last_direct_topic":"heat_pump_brands","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

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
responseTimeMs: 2972
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Klimatizácia do obývačky a spálne

Rozumiem, chceš riešenie na chladenie pre obývačku a spálňu. Klimatizácia je na to vhodná.

**Predbežný verdikt:** Pre tieto dve miestnosti sa najčastejšie hodí buď jedna vonkajšia jednotka s dvoma vnútornými (tzv. multisplit systém), alebo dve samostatné jednotky (každá s vlastnou vonkajšou jednotkou). Výber závisí od dispozície domu/bytu a vašich preferencií.

**Prečo:** Multisplit systém je často elegantnejšie riešenie, keďže zaberie menej miesta zvonku. Samostatné jednotky môžu byť flexibilnejšie pri umiestnení a niekedy aj cenovo dostupnejšie, ak by ste v budúcnosti chceli pridať ďalšie.

**Typický rozsah:** Ponúkame kompletnú realizáciu od návrhu až po montáž. Servis našich inštalácií zabezpečujeme.

Aby som ti mohol lepšie poradiť, potreboval by som vedieť:
* Akú približnú plochu majú tieto dve miestnosti.
* Ide o novostavbu alebo rekonštrukciu?

## Rekuperácia v novostavbe

### Turn 1

User: staviam dom a chcem lepsi vzduch bez otvarania okien
Pass: yes
responseTimeMs: 2723
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
validatorsTriggered: inspection_claim_sanitized, overconfident_wording_softened, followup_questions_limited
retrievalQuery: service router verdict gate service-card-heat-recovery rekuperacia vetranie rekuperácia recommendation služba rekuperácia zámer recommendation objekt rodinný dom staviam dom a chcem lepsi vzduch bez otvarania okien
enrichedRetrievalQuery: service router verdict gate service-card-heat-recovery rekuperacia vetranie rekuperácia recommendation služba rekuperácia zámer recommendation objekt rodinný dom staviam dom a chcem lepsi vzduch bez otvarania okien
storedSlots: {"service_type":"heat_recovery","service_intent":"recommendation","property_type":"rodinný dom","qualification_question_rounds":0}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Rekuperácia pre váš nový dom

Jasné, rozumiem. Chceš si zabezpečiť kvalitný vzduch v novom dome bez toho, aby si musel otvárať okná, a to najmä kvôli tepelným stratám. To je konkrétne to, na čo je rekuperácia ideálna.

**Prečo rekuperácia.**
Rekuperácia je moderný systém riadeného vetrania, ktorý zabezpečuje neustály prísun čerstvého vzduchu do domu a zároveň odvádza ten "použitý". Najväčšou výhodou je, že pri tomto procese získava späť až 90% tepla z odvádzaného vzduchu, takže v zime ti neuniká drahocenné teplo von a v lete sa zas predchádza úniku chladu. Tým šetríš energiu a zároveň máš doma stále sviežo a zdravo.

**Čo potrebujeme vedieť ďalej.**
Keďže staviaš nový dom, najlepšie riešenie je centrálna rekuperácia, ktorá sa dá ideálne naplánovať už v projektovej fáze. Aby som ti mohol poradiť konkrétnejšie, potreboval by som vedieť:

1. **Akú máš celkovú podlahovú plochu domu alebo približný počet miestností.**
2. **Máš už hotový projekt domu, kde by sa dali zakomponovať rozvody vzduchu?**

Keď budeme mať tieto informácie, môžeme sa pozrieť na konkrétne možnosti a navrhnúť riešenie priamo pre teba.

## NIBE servisná chyba

### Turn 1

User: tepelne cerpadlo NIBE mi hlasi chybu
Pass: yes
responseTimeMs: 2045
answerMode: service_fault_triage
serviceType: service
serviceIntent: service_fault
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 0
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized, service_fault_data_request_repaired, service_fault_followup_appended
retrievalQuery: service router verdict gate service-card-service servis porucha servis zariadení service_fault služba servis zariadení zámer service_fault tepelne cerpadlo NIBE mi hlasi chybu
enrichedRetrievalQuery: service router verdict gate service-card-service servis porucha servis zariadení service_fault služba servis zariadení zámer service_fault tepelne cerpadlo NIBE mi hlasi chybu
storedSlots: {"service_type":"service","service_intent":"service_fault","qualification_question_rounds":0}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Servisný smer

Rozumiem, NIBE hlási chybu. Pri poruche by som neradil žiadny svojpomocný zásah do zariadenia; najprv treba zistiť presný model, chybový kód a lokalitu, aby sa dalo posúdiť, či ide o servisný zásah a aký postup je bezpečný.

Pri zariadeniach montovaných inou firmou treba dostupnosť servisu potvrdiť podľa značky a prípadu.

Pošli mi prosím model alebo fotku štítku, chybový kód z displeja a mesto, kde je zariadenie.

Ide o existujúce zariadenie s poruchou, pravidelný servis, alebo zvažuješ výmenu za nové riešenie?

## Dotácie

### Turn 1

User: pomozete mi s dotaciou?
Pass: yes
responseTimeMs: 2046
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
validatorsTriggered: inspection_claim_sanitized, subsidy_price_deduction_claim_sanitized, overconfident_wording_softened, followup_questions_limited
retrievalQuery: service router verdict gate service-card-subsidy dotacie dotácie subsidy služba dotácie zámer subsidy pomozete mi s dotaciou?
enrichedRetrievalQuery: service router verdict gate service-card-subsidy dotacie dotácie subsidy služba dotácie zámer subsidy pomozete mi s dotaciou?
storedSlots: {"service_type":"subsidy","service_intent":"subsidy","qualification_question_rounds":0}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Pomoc s dotáciami

Jasné, s dotáciami ti vieme pomôcť. Naša firma asistuje pri získavaní dotácií, ale konkrétne podmienky a možnosti sa môžu meniť podľa aktuálnych programov.Zohľadnenie dotácie v cene treba potvrdiť podľa konkrétneho prípadu.

Aby som ti mohol lepšie poradiť, potreboval by som vedieť pár základných vecí:

1. Aké konkrétne zariadenie chceš riešiť (napr. tepelné čerpadlo, klimatizácia, rekuperácia).
2. Ide o rodinný dom, alebo iný typ objektu.
3. Ide o novú realizáciu, alebo výmenu existujúceho zariadenia?

## Priame otazky na znacky, modely a ceny

### Turn 1

User: potreboval by som vybrat tepelne cerpadlo
Pass: yes
responseTimeMs: 3088
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom.
2. koľko m2 chceš vykurovať.
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: mam starsi dom, radiatory a chcem usetrit
Pass: yes
responseTimeMs: 2481
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
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, overconfident_wording_softened
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","heating_distribution":"radiátory","qualification_question_rounds":1,"last_direct_topic":"savings_roi_scope","last_price_topic":"savings_roi_scope"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","heating_distribution":"radiátory"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Pri staršom dome s radiátormi je dôležité overiť, či súčasné radiátory dokážu efektívne pracovať s nižšou teplotou vody, ktorú tepelné čerpadlo bežne dodáva. Ak nie, môže byť potrebná ich výmena alebo doplnenie.

Presnú úsporu a návratnosť investície bez detailnej analýzy vášho domu a súčasných nákladov nesľubujem. Záleží na mnohých faktoroch, ako je zateplenie domu, vaša aktuálna spotreba a ceny energií.

Pre realistický odhad úspor a celkových nákladov na realizáciu by bolo najlepšie absolvovať krátku konzultáciu. Viete mi povedať, akým spôsobom sa teraz primárne vykurujete a aká je približná ročná spotreba energie na vykurovanie?

### Turn 3

User: dom ma asi 120m
Pass: yes
responseTimeMs: 2677
answerMode: rag_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 2
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: inspection_claim_sanitized
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá price scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer price projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory potreboval by som vybrat tepelne cerpadlo mam starsi dom, radiatory a chcem usetrit dom ma asi 120m
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá price scenar-starsi-dom-radiatory-plyn radiatorovy system vyssia teplota vody služba tepelné čerpadlá zámer price projekt rekonštrukcia objekt rodinný dom plocha 120 m2 vykurovanie radiátory potreboval by som vybrat tepelne cerpadlo mam starsi dom, radiatory a chcem usetrit dom ma asi 120m
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"savings_roi_scope","last_price_topic":"savings_roi_scope"}
newlyExtractedSlots: {}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Tepelné čerpadlo pre starší dom s radiátormi a úsporou

Rozumiem, že chceš riešiť tepelné čerpadlo pre starší dom s radiátormi s cieľom ušetriť. Máš už 120 m² plochy, čo je dobrý základ.

**Predbežný smer:** Pre starší dom s radiátormi sa často hodí tepelné čerpadlo vzduch-voda, ktoré dokáže pracovať aj s vyššou teplotou vody, ak to tvoje radiátory vyžadujú. Dôležité je overiť ich výkon a či zvládnu vykurovať dom pri optimálnej teplote pre tepelné čerpadlo.

**Čo treba overiť:**
* **Výkon radiátorov:** Dokážu tvoje súčasné radiátory vykúriť dom pri nižšej teplote vody (napr. 50-55 °C), ktorú bežne dodávajú tepelné čerpadlá? Ak nie, možno bude potrebné ich vymeniť alebo doplniť.
* **Aktuálny zdroj tepla a spotreba:** Aby sme mohli odhadnúť úsporu, potrebujeme vedieť, čím sa teraz vykuruješ a aká je tvoja ročná spotreba energie (napr. v kWh alebo €).

**Ďalší krok:** Aby sme ti vedeli čo najpresnejšie poradiť a pripraviť cenovú ponuku, potrebovali by sme vedieť, akým spôsobom sa teraz primárne vykuruješ a aká je približná ročná spotreba energie na vykurovanie.

### Turn 4

User: a znacka?
Pass: yes
responseTimeMs: 2308
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
retrievalQuery: company-truth brands NIBE Vaillant IVT Daikin Mitsubishi tepelné čerpadlá portfólio Geotherm
enrichedRetrievalQuery: company-truth brands NIBE Vaillant IVT Daikin Mitsubishi tepelné čerpadlá portfólio Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":3,"last_direct_topic":"heat_pump_brands","last_price_topic":"savings_roi_scope","last_brand_model_topic":"heat_pump_brands"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Pri tepelných čerpadlách môžem bezpečne komunikovať značky **NIBE** a **Vaillant**. Značku IVT spomínam opatrne, len ak je potvrdená v aktuálnej ponuke. Značky ako Daikin alebo Mitsubishi neuvádzam ako naše portfólio pri tepelných čerpadlách, pokiaľ to nie je explicitne potvrdené. Výber konkrétneho modelu závisí od detailov vášho domu a potrieb.

Aký je váš súčasný zdroj tepla a aká je vaša približná ročná spotreba energie na vykurovanie?

### Turn 5

User: cize geotherm robi aj Daikin?
Pass: yes
responseTimeMs: 1898
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
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, unsupported_heat_pump_brand_sanitized
retrievalQuery: company-truth brands Daikin tepelné čerpadlá klimatizácie Geotherm portfólio
enrichedRetrievalQuery: company-truth brands Daikin tepelné čerpadlá klimatizácie Geotherm portfólio
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":4,"last_direct_topic":"Daikin","last_price_topic":"savings_roi_scope","last_brand_model_topic":"Daikin"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Pri tepelných čerpadlách sa v našej ponuke primárne zameriavame na značky **NIBE** a **Vaillant**.Pri tepelných čerpadlách viem bezpečne komunikovať NIBE a Vaillant; Daikin alebo Mitsubishi treba pri TČ potvrdiť podľa aktuálnej ponuky.

Aký je váš súčasný zdroj tepla a aká je vaša približná ročná spotreba energie na vykurovanie?

### Turn 6

User: mne povedali ze robia iba NIBE a vaillant
Pass: yes
responseTimeMs: 2093
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
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth correction rules brands models obsolete F2040 NIBE Vaillant Daikin Mitsubishi direct answer
enrichedRetrievalQuery: company-truth correction rules brands models obsolete F2040 NIBE Vaillant Daikin Mitsubishi direct answer
storedSlots: {"service_type":"heat_pump","service_intent":"complaint_or_correction","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":5,"last_direct_topic":"brand_correction","last_price_topic":"savings_roi_scope","last_brand_model_topic":"Daikin"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"complaint_or_correction"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Prepáč, ak som ťa zmiatol. Pri tepelných čerpadlách sa v našej ponuke primárne zameriavame na značky **NIBE** a **Vaillant**. Značky ako Daikin alebo Mitsubishi neuvádzam ako naše portfólio pri tepelných čerpadlách, pokiaľ to nie je explicitne potvrdené.

Aký je váš súčasný zdroj tepla a aká je vaša približná ročná spotreba energie na vykurovanie?

### Turn 7

User: ake mate Vaillant?
Pass: yes
responseTimeMs: 2020
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 6
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm
enrichedRetrievalQuery: company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":6,"last_direct_topic":"Vaillant","last_price_topic":"savings_roi_scope","last_brand_model_topic":"Vaillant"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Pri tepelných čerpadlách sa v našej ponuke primárne zameriavame na značky **NIBE** a **Vaillant**. Pre Vaillant máme v ponuke napríklad vzduch-voda riešenia ako aroTHERM plus a aroTHERM Split. Konkrétny model však vždy závisí od špecifických potrieb vášho domu, ako je jeho veľkosť, zateplenie a súčasný systém vykurovania.

Aký je váš súčasný zdroj tepla a aká je vaša približná ročná spotreba energie na vykurovanie?

### Turn 8

User: a split?
Pass: yes
responseTimeMs: 2002
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 7
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm
enrichedRetrievalQuery: company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":7,"last_direct_topic":"Vaillant Split","last_price_topic":"savings_roi_scope","last_brand_model_topic":"Vaillant Split"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Áno, Vaillant aroTHERM Split je typ tepelného čerpadla vzduch-voda v splitovej verzii. Pre váš dom s radiátormi je dôležité overiť, či radiátory dokážu efektívne vykurovať pri nižších teplotách vody, ktoré tepelné čerpadlá zvyčajne preferujú.

Aký je váš súčasný zdroj tepla a aká je vaša približná ročná spotreba energie na vykurovanie?

### Turn 9

User: F2040 uz sa nevyraba
Pass: yes
responseTimeMs: 2125
answerMode: correction_answer
serviceType: heat_pump
serviceIntent: complaint_or_correction
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 8
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth correction rules brands models obsolete F2040 NIBE Vaillant Daikin Mitsubishi direct answer
enrichedRetrievalQuery: company-truth correction rules brands models obsolete F2040 NIBE Vaillant Daikin Mitsubishi direct answer
storedSlots: {"service_type":"heat_pump","service_intent":"complaint_or_correction","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":8,"last_direct_topic":"F2040_obsolete","last_price_topic":"savings_roi_scope","last_brand_model_topic":"Vaillant Split"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"complaint_or_correction"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Máš pravdu, model F2040 už nie je aktuálny a nemal by som ho ponúkať ako novú inštaláciu. Je to starší model, ktorý sa už nevyrába.

Pre váš dom s radiátormi by sme sa mali zamerať na aktuálne vzduch-voda tepelné čerpadlá, ktoré sú vhodné pre tento typ vykurovania. Vždy vyberáme konkrétny model až po dôkladnom posúdení vášho domu a jeho potrieb. Naše portfólio zahŕňa značky NIBE a Vaillant.

### Turn 10

User: A F2050?
Pass: yes
responseTimeMs: 2101
answerMode: brand_model_answer
serviceType: heat_pump
serviceIntent: brand_model
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 8
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth product-facts NIBE F2050 aktuálne modely tepelné čerpadlá portfólio Geotherm
enrichedRetrievalQuery: company-truth product-facts NIBE F2050 aktuálne modely tepelné čerpadlá portfólio Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":8,"last_direct_topic":"F2050","last_price_topic":"savings_roi_scope","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Model NIBE F2050 nemám potvrdený ako aktuálne odporúčaný model v našej ponuke. Preto ho nebudem detailne popisovať ani odporúčať.

Pre váš starší dom s radiátormi by sme sa mali zamerať na vhodné vzduch-voda tepelné čerpadlá, ktoré sú aktuálne dostupné a vhodné pre váš systém. Vždy vyberáme konkrétny model až po dôkladnom posúdení vášho domu a jeho potrieb. V našom portfóliu máme najmä značky NIBE a Vaillant.

### Turn 11

User: ake su ceny vratane instalacie
Pass: yes
responseTimeMs: 2399
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 8
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","qualification_question_rounds":8,"last_direct_topic":"price","last_price_topic":"price","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Cena tepelného čerpadla vrátane inštalácie sa líši v závislosti od konkrétneho modelu, výkonu a rozsahu prác. Vždy je potrebné rozlišovať cenu samotného zariadenia a cenu kompletnej realizácie na kľúč.

Kompletná cena môže zahŕňať samotné tepelné čerpadlo, montáž, potrebný materiál, elektroinštaláciu, uvedenie do prevádzky a prípadné doplnkové komponenty ako zásobník na teplú vodu alebo akumulačná nádrž.

Pre váš dom s rozlohou 120 m² a radiátormi by sme sa mali zamerať na aktuálne modely od značiek NIBE alebo Vaillant.

Ide o inštaláciu nového tepelného čerpadla, výmenu starého zdroja tepla, alebo servis existujúceho zariadenia?

### Turn 12

User: 7tis je asi malo nie?
Pass: yes
responseTimeMs: 2486
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 9
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, buffer_tank_included_claim_sanitized, vague_price_followup_repaired, overconfident_wording_softened
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","hot_water":false,"qualification_question_rounds":9,"last_direct_topic":"low_price_scope","last_price_topic":"low_price_scope","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### K cene 7 tisíc

Áno, **7 tisíc môže byť pri kompletnom tepelnom čerpadle podozrivo nízka suma**, najmä ak sa bavíme o staršom dome s radiátormi a výmenou kotla. Pri tvojom kontexte (Pre tvoj prípad (rekonštrukcia, 120 m², radiátory) by som to bral ako orientačný výber, nie finálny model) by som to nebral ako potvrdenú kompletnú cenu.

Treba konkrétne overiť, čo je v tej sume: samotná zostava, montážny materiál, práca, regulácia, TÚV zásobník, akumulačná nádrž, elektropríprava, uvedenie do prevádzky a prípadné úpravy kotolne.

### Turn 13

User: potrebujem akumulacku, ci aj ta je v cene?
Pass: yes
responseTimeMs: 2505
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 9
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, overconfident_wording_softened
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","hot_water":false,"qualification_question_rounds":9,"last_direct_topic":"buffer_tank_price_scope","last_price_topic":"buffer_tank_price_scope","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Neviem potvrdiť, či je akumulačná nádrž zahrnutá v cene, pokiaľ to nie je explicitne uvedené v ponuke. Pri vykurovaní radiátormi alebo pri zložitejšej kotolni môže byť akumulačná nádrž potrebná, ale jej zahrnutie do celkovej ceny je potrebné overiť. Pri sume 7 tisíc je dôležité si overiť, čo konkrétne cena zahŕňa – či ide len o samotné zariadenie, alebo o kompletnú realizáciu vrátane montáže, materiálu, elektroprác a uvedenia do prevádzky.

### Turn 14

User: z coho?
Pass: yes
responseTimeMs: 1933
answerMode: price_answer
serviceType: heat_pump
serviceIntent: price
sourcesCount: 3
fallbackType: n/a
questionRoundsCount: 9
closureGateTriggered: false
closureReason: n/a
recommendationOptions: []
remainingCriticalUnknowns: []
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, overconfident_wording_softened
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","property_type":"rodinný dom","area_m2":120,"heating_distribution":"radiátory","hot_water":false,"qualification_question_rounds":9,"last_direct_topic":"price_basis","last_price_topic":"price_basis","last_brand_model_topic":"F2050"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Z čoho sa skladá cena tepelného čerpadla? Rozlišujeme cenu samotného zariadenia a cenu kompletnej realizácie na kľúč. Kompletná cena môže zahŕňať samotné tepelné čerpadlo, vnútorný modul, reguláciu, montážny materiál, prácu, uvedenie do prevádzky, prípravu teplej úžitkovej vody a podľa návrhu aj akumulačnú nádrž. Bez detailnej ponuky nie je možné konkrétne určiť, čo všetko je v cene zahrnuté.

## Priama odpoved ostava AI a otaznik sa nerecykluje

### Turn 1

User: ahoj, ake TC mate?
Pass: yes
responseTimeMs: 2062
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Ponúkame tepelné čerpadlá značiek NIBE a Vaillant. IVT spomíname opatrne, nakoľko dostupnosť a vhodnosť konkrétneho modelu treba vždy overiť podľa špecifikácií vášho domu a aktuálnej ponuky.

Aby som vám mohol lepšie poradiť, potreboval by som vedieť, či ide o novostavbu alebo starší dom a či máte na vykurovanie radiátory alebo podlahové kúrenie.

### Turn 2

User: ?
Pass: yes
responseTimeMs: 1948
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Upresnenie

Myslel som tým: pri tepelných čerpadlách viem ako bezpečné firemné portfólio komunikovať hlavne NIBE a Vaillant. To ešte nie je výber vhodného čerpadla pre tvoj dom.

Ak chceš, aby som odporučil smer pre teba, napíš mi, či ide o novostavbu alebo starší dom a či máš radiátory alebo podlahovku.

## Cena a znacky sa neprenasaju do dalsich otazok

### Turn 1

User: Ahoj, chcem tc
Pass: yes
responseTimeMs: 4104
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom.
2. koľko m2 chceš vykurovať.
3. máš radiátory alebo podlahové kúrenie?

### Turn 2

User: Starsi 140m radiatory
Pass: yes
responseTimeMs: 2207
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Tepelné čerpadlo pre starší dom s radiátormi

Rozumiem, máš starší dom s plochou 140 m² a vykurovanie cez radiátory. V takom prípade je predbežný smer výmeny súčasného zdroja tepla (napríklad plynového kotla) za tepelné čerpadlo typu vzduch-voda.

**Dôvod:** Tepelné čerpadlá vzduch-voda sú najbežnejším riešením pre rekonštrukcie a dokážu efektívne pracovať aj so staršími vykurovacími systémami.

**Čo treba overiť:** Kľúčové je, či tvoje súčasné radiátory dokážu efektívne vykúriť dom pri nižšej teplote vody, ktorú tepelné čerpadlo dodáva. Ak sú radiátory príliš malé alebo dom potrebuje vyššiu teplotu vody, môže byť potrebné ich upraviť alebo vymeniť.

Aby som ti mohol lepšie poradiť, potreboval by som ešte vedieť:
* Akým zdrojom tepla kúriš teraz a aká je tvoja približná ročná spotreba energie na kúrenie.
* Je dom zateplený?

### Turn 3

User: chcem Vaillant ale mam NIBE
Pass: yes
responseTimeMs: 2800
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
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, nibe_vaillant_context_followup_repaired
retrievalQuery: company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm
enrichedRetrievalQuery: company-truth product-facts Vaillant aroTHERM plus aroTHERM Split tepelné čerpadlá radiátory Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"brand_model","project_type":"rekonštrukcia","area_m2":140,"heating_distribution":"radiátory","qualification_question_rounds":2,"last_direct_topic":"Vaillant","last_brand_model_topic":"Vaillant"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"brand_model"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Rozumiem, že preferuješ značku Vaillant, aj keď momentálne máš tepelné čerpadlo NIBE. V tvojom prípade rekonštrukcie staršieho domu s radiátormi je dôležité zamerať sa na správny návrh výkonu a kompatibilitu s existujúcim systémom.

Vaillant patrí medzi overené značky tepelných čerpadiel, rovnako ako NIBE. Pri výbere konkrétneho modelu je však kľúčové zohľadniť nielen značku, ale aj výkon, potrebu TÚV, hydraulické zapojenie a priestorové možnosti.

Preto by som odporúčal vykonať podrobnú obhliadku a konzultáciu, aby sme mohli porovnať možnosti a pripraviť optimálnu ponuku pre tvoj dom.

Riešiš servis existujúceho NIBE, výmenu za Vaillant, alebo nové nacenenie celého riešenia?

### Turn 4

User: daj mi presnu cenu
Pass: yes
responseTimeMs: 2164
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
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, overconfident_wording_softened, vague_price_followup_repaired, sensitive_price_scope_repaired
retrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
enrichedRetrievalQuery: company-truth pricing-rules cena náklady návratnosť úspora servis ponuka tepelné čerpadlo montáž inštalácia akumulačná nádrž čo je v cene rozsah ponuky
storedSlots: {"service_type":"heat_pump","service_intent":"price","project_type":"rekonštrukcia","area_m2":140,"heating_distribution":"radiátory","qualification_question_rounds":3,"last_direct_topic":"price","last_price_topic":"price","last_brand_model_topic":"Vaillant"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"price"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Konkrétnu cenu bez údajov o dome a rozsahu prác nebudem hádať.

Pri nacenení treba rozlíšiť cenu zariadenia a kompletnej realizácie: výkon, typ vykurovania, montáž, reguláciu, TÚV, elektroprípravu, prípadnú akumulačnú nádrž a úpravy kotolne. Najlepší ďalší krok je krátka konzultácia s Geotherm, kde sa rozsah nacení podľa domu.

### Turn 5

User: opravite to alebo treba montaz?
Pass: yes
responseTimeMs: 2306
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
validatorsTriggered: direct_answer_gate_used, latest_direct_question_answered, direct_answer_composed_by_llm, repair_or_installation_followup_repaired, service_fault_data_request_repaired, service_fault_followup_appended
retrievalQuery: company-truth servis montaz oprava nove riesenie cena termin Geotherm
enrichedRetrievalQuery: company-truth servis montaz oprava nove riesenie cena termin Geotherm
storedSlots: {"service_type":"heat_pump","service_intent":"service_fault","project_type":"rekonštrukcia","area_m2":140,"heating_distribution":"radiátory","qualification_question_rounds":3,"last_direct_topic":"repair_or_installation_followup","last_price_topic":"price","last_brand_model_topic":"Vaillant"}
newlyExtractedSlots: {"service_type":"heat_pump","service_intent":"service_fault"}
flow: diagnostic-v5-recommendation-closure @ 02cfedc

### Servisný smer

Rozumiem, zariadenie hlási chybu. Pri poruche by som neradil žiadny svojpomocný zásah do zariadenia; najprv treba zistiť presný model, chybový kód a lokalitu, aby sa dalo posúdiť, či ide o servisný zásah a aký postup je bezpečný.

Pri zariadeniach montovaných inou firmou treba dostupnosť servisu potvrdiť podľa značky a prípadu.

Pošli mi prosím model alebo fotku štítku, chybový kód z displeja a mesto, kde je zariadenie.

Ide o existujúce zariadenie s poruchou, pravidelný servis, alebo zvažuješ výmenu za nové riešenie?

### Turn 6

User: ahoj
Pass: yes
responseTimeMs: 2048
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
flow: diagnostic-v5-recommendation-closure @ 02cfedc

Ahoj, som tu.
