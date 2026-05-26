# Diagnostic Conversation Test Report

Generated: 2026-05-26T12:55:59.960Z

Verdict: PASS
Failed turns: 0/5

## Turn 1

User: ahoj, aké tep. čerpadlo je najlepšie?
Pass: yes
responseTimeMs: 14333
answerMode: rag_answer
serviceType: heat_pump
serviceIntent: recommendation
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation ahoj, aké tep. čerpadlo je najlepšie?
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation ahoj, aké tep. čerpadlo je najlepšie?
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation"}
flow: diagnostic-v3-stateful-live @ 687ed5f
sources: 3

### Predbežný smer

Najčastejšie sa pri rodinných domoch začína pri tepelnom čerpadle **vzduch-voda**. Ak ide o novostavbu s podlahovým kúrením, býva to veľmi vhodný smer; pri staršom dome s radiátormi treba najprv overiť potrebnú teplotu vody a výkon radiátorov.

Aby som ťa zaradil správne, napíš mi:
1. je to novostavba alebo starší dom?
2. koľko m2 chceš vykurovať?
3. máš radiátory alebo podlahové kúrenie?

## Turn 2

User: 1. novostavbu, 2. 120, 3. podlahovka
Pass: yes
responseTimeMs: 14198
answerMode: rag_answer
serviceType: heat_pump
serviceIntent: recommendation
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie ahoj, aké tep. čerpadlo je najlepšie? 1. novostavbu, 2. 120, 3. podlahovka
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie ahoj, aké tep. čerpadlo je najlepšie? 1. novostavbu, 2. 120, 3. podlahovka
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"heating_distribution":"podlahové kúrenie"}
flow: diagnostic-v3-stateful-live @ 687ed5f
sources: 3

### Predbežný verdikt

Pre teba by som predbežne išiel do tepelného čerpadla **vzduch-voda** pre **novostavbu s nízkoteplotným podlahovým kúrením** pri dome cca 120 m². Dáva to zmysel hlavne preto, že podlahovka pracuje s nízkou teplotou vody, čo tepelnému čerpadlu vyhovuje.
Konkrétny výkon a model by som vybral až podľa projektu, energetického certifikátu alebo tepelnej straty.

Koľko osôb bude v dome a chceš riešiť aj chladenie v lete?

## Turn 3

User: 1. 5, 2. áno
Pass: yes
responseTimeMs: 14841
answerMode: rag_answer
serviceType: heat_pump
serviceIntent: recommendation
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie ahoj, aké tep. čerpadlo je najlepšie? 1. novostavbu, 2. 120, 3. podlahovka 1. 5, 2. áno
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie ahoj, aké tep. čerpadlo je najlepšie? 1. novostavbu, 2. 120, 3. podlahovka 1. 5, 2. áno
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"heating_distribution":"podlahové kúrenie","wants_cooling":true,"occupants":5}
flow: diagnostic-v3-stateful-live @ 687ed5f
sources: 3

### Predbežný verdikt

Pre teba by som predbežne išiel do tepelného čerpadla **vzduch-voda** pre **novostavbu s nízkoteplotným podlahovým kúrením** pri dome cca 120 m². Dáva to zmysel hlavne preto, že podlahovka pracuje s nízkou teplotou vody, čo tepelnému čerpadlu vyhovuje.
Pri 5 osobách by som v návrhu rátal aj so **zásobníkom TÚV** primeraným spotrebe domácnosti.
Chladenie treba navrhnúť cielene: podlahové chladenie vie dom jemne ochladiť, ale má limity a treba riešiť rosný bod; komfortnejšie býva stropné chladenie, fancoily alebo klimatizácia podľa projektu.
Konkrétny výkon a model by som vybral až podľa projektu, energetického certifikátu alebo tepelnej straty.

Máš projekt, tepelnú stratu alebo energetický certifikát?

### Odporúčanie pre tvoju novostavbu

Super, ďakujem za upresnenie. Pre tvoju novostavbu s podlahovým kúrením, 120 m² a 5 osobami, ktoré chcú aj chladenie, by som sa zameral na tepelné čerpadlo **vzduch-voda**. Je to efektívne riešenie, ktoré zvládne vykurovanie aj príjemné chladenie v lete.

Pre presnejší návrh by som potreboval vidieť projekt domu, energetický certifikát alebo presnú tepelnú stratu. Tieto údaje nám pomôžu určiť ideálny výkon čerpadla.

Máš už projekt domu pripravený, alebo riešiš aj tento krok s nami?

## Turn 4

User: Bratislava, nemám odhad
Pass: yes
responseTimeMs: 13326
answerMode: rag_answer
serviceType: heat_pump
serviceIntent: recommendation
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 projekt energeticky certifikat tepelna strata chyba odhad vykonu služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie tepelná strata alebo odhad nie je k dispozícii počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie lokalita Bratislava ahoj, aké tep. čerpadlo je najlepšie? 1. n
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 projekt energeticky certifikat tepelna strata chyba odhad vykonu služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie tepelná strata alebo odhad nie je k dispozícii počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie lokalita Bratislava ahoj, aké tep. čerpadlo je najlepšie? 1. n
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"location":"Bratislava","heating_distribution":"podlahové kúrenie","wants_cooling":true,"occupants":5,"heat_loss_known":false}
flow: diagnostic-v3-stateful-live @ 687ed5f
sources: 3

### Predbežný verdikt

Pre teba by som predbežne išiel do tepelného čerpadla **vzduch-voda** pre **novostavbu s nízkoteplotným podlahovým kúrením** pri dome cca 120 m². Dáva to zmysel hlavne preto, že podlahovka pracuje s nízkou teplotou vody, čo tepelnému čerpadlu vyhovuje.
Pri 5 osobách by som v návrhu rátal aj so **zásobníkom TÚV** primeraným spotrebe domácnosti.
Chladenie treba navrhnúť cielene: podlahové chladenie vie dom jemne ochladiť, ale má limity a treba riešiť rosný bod; komfortnejšie býva stropné chladenie, fancoily alebo klimatizácia podľa projektu.
Konkrétny výkon a model by som vybral až podľa projektu, energetického certifikátu alebo tepelnej straty.

Máš projekt, tepelnú stratu alebo energetický certifikát?

### Predbežný verdikt

Pre tvoju novostavbu v Bratislave s podlahovým kúrením (120 m², 5 osôb) a požiadavkou na chladenie by som predbežne odporučil tepelné čerpadlo **vzduch-voda**. Je to efektívne riešenie pre nízko-teplotné systémy ako podlahovka a zvládne aj letné chladenie.

Keďže nemáš odhad tepelnej straty, najlepšie by bolo vychádzať z **projektovej dokumentácie domu**. Tá nám dá presné údaje o tom, aký výkon bude potrebný na vykurovanie a chladenie.

### Ďalšie kroky

1. **Projektová dokumentácia:** Máš už k dispozícii projekt domu? Ak áno, pozrieme sa naň.
2. **Obhliadka:** Ak projekt nemáš, alebo by si chcel vidieť možnosti naživo, môžeme dohodnúť obhliadku tvojho pozemku/domu.

Tieto kroky nám pomôžu určiť presný typ a výkon tepelného čerpadla, ktoré bude pre tvoju novostavbu najvhodnejšie.

## Turn 5

User: si mi nepovedal najlepšie čerpadlo pre mňa
Pass: yes
responseTimeMs: 13082
answerMode: rag_answer
serviceType: heat_pump
serviceIntent: recommendation
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 projekt energeticky certifikat tepelna strata chyba odhad vykonu služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie tepelná strata alebo odhad nie je k dispozícii počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie lokalita Bratislava ahoj, aké tep. čerpadlo je najlepšie? 1. n
enrichedRetrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 projekt energeticky certifikat tepelna strata chyba odhad vykonu služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie tepelná strata alebo odhad nie je k dispozícii počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie lokalita Bratislava ahoj, aké tep. čerpadlo je najlepšie? 1. n
storedSlots: {"service_type":"heat_pump","service_intent":"recommendation","project_type":"novostavba","area_m2":120,"location":"Bratislava","heating_distribution":"podlahové kúrenie","wants_cooling":true,"occupants":5,"heat_loss_known":false}
flow: diagnostic-v3-stateful-live @ 687ed5f
sources: 3

### Predbežný verdikt

Pre teba by som predbežne išiel do tepelného čerpadla **vzduch-voda** pre **novostavbu s nízkoteplotným podlahovým kúrením** pri dome cca 120 m². Dáva to zmysel hlavne preto, že podlahovka pracuje s nízkou teplotou vody, čo tepelnému čerpadlu vyhovuje.
Pri 5 osobách by som v návrhu rátal aj so **zásobníkom TÚV** primeraným spotrebe domácnosti.
Chladenie treba navrhnúť cielene: podlahové chladenie vie dom jemne ochladiť, ale má limity a treba riešiť rosný bod; komfortnejšie býva stropné chladenie, fancoily alebo klimatizácia podľa projektu.
Konkrétny výkon a model by som vybral až podľa projektu, energetického certifikátu alebo tepelnej straty.

Máš projekt, tepelnú stratu alebo energetický certifikát?

### Predbežný verdikt

Pre tvoju novostavbu v Bratislave s podlahovým kúrením (120 m², 5 osôb) a požiadavkou na chladenie by som predbežne odporučil tepelné čerpadlo **vzduch-voda**. Je to efektívne riešenie pre nízko-teplotné systémy ako podlahovka a zvládne aj letné chladenie.

Keďže nemáš odhad tepelnej straty, najlepšie by bolo vychádzať z **projektovej dokumentácie domu**. Tá nám dá presné údaje o tom, aký výkon bude potrebný na vykurovanie a chladenie.

### Ďalšie kroky

1. **Projektová dokumentácia:** Máš už k dispozícii projekt domu? Ak áno, pozrieme sa naň.
2. **Obhliadka:** Ak projekt nemáš, alebo by si chcel vidieť možnosti naživo, môžeme dohodnúť obhliadku tvojho pozemku/domu.

Tieto kroky nám pomôžu určiť presný typ a výkon tepelného čerpadla, ktoré bude pre tvoju novostavbu najvhodnejšie.
