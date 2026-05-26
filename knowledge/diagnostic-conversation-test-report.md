# Diagnostic Conversation Test Report

Generated: 2026-05-26T12:38:33.082Z

Verdict: PASS
Failed turns: 0/5

## Turn 1

User: ahoj, aké tep. čerpadlo je najlepšie?
Pass: yes
responseTimeMs: 15392
answerMode: rag_answer
serviceType: heat_pump
serviceIntent: recommendation
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation služba tepelné čerpadlá zámer recommendation ahoj, aké tep. čerpadlo je najlepšie?
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
responseTimeMs: 14942
answerMode: rag_answer
serviceType: heat_pump
serviceIntent: recommendation
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie ahoj, aké tep. čerpadlo je najlepšie? 1. novostavbu, 2. 120, 3. podlahovka
sources: 3

### Predbežný verdikt

Pre teba by som predbežne išiel do tepelného čerpadla **vzduch-voda** pre **novostavbu s nízkoteplotným podlahovým kúrením** pri dome cca 120 m². Dáva to zmysel hlavne preto, že podlahovka pracuje s nízkou teplotou vody, čo tepelnému čerpadlu vyhovuje.
Konkrétny výkon a model by som vybral až podľa projektu, energetického certifikátu alebo tepelnej straty.

Koľko osôb bude v dome a chceš riešiť aj chladenie v lete?

## Turn 3

User: 1. 5, 2. áno
Pass: yes
responseTimeMs: 13477
answerMode: rag_answer
serviceType: heat_pump
serviceIntent: recommendation
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie ahoj, aké tep. čerpadlo je najlepšie? 1. novostavbu, 2. 120, 3. podlahovka 1. 5, 2. áno
sources: 3

### Predbežný verdikt

Pre teba by som predbežne išiel do tepelného čerpadla **vzduch-voda** pre **novostavbu s nízkoteplotným podlahovým kúrením** pri dome cca 120 m². Dáva to zmysel hlavne preto, že podlahovka pracuje s nízkou teplotou vody, čo tepelnému čerpadlu vyhovuje.
Pri 5 osobách by som v návrhu rátal aj so **zásobníkom TÚV** primeraným spotrebe domácnosti.
Chladenie treba navrhnúť cielene: podlahové chladenie vie dom jemne ochladiť, ale má limity a treba riešiť rosný bod; komfortnejšie býva stropné chladenie, fancoily alebo klimatizácia podľa projektu.
Konkrétny výkon a model by som vybral až podľa projektu, energetického certifikátu alebo tepelnej straty.

Máš projekt, tepelnú stratu alebo energetický certifikát?

### Ďalšie kroky k výberu tepelného čerpadla

Super, ďakujem za doplnenie. Pre novostavbu s podlahovým kúrením a 5 osobami, kde chceš riešiť aj letné chladenie, je tepelné čerpadlo vzduch-voda stále dobrou voľbou.

Aby som ti vedel odporučiť konkrétnejší model a výkon, potreboval by som ešte vedieť:
* Máš k dispozícii projekt domu, kde je uvedená tepelná strata, alebo energetický certifikát?
* Aký typ ohrevu teplej úžitkovej vody preferuješ (napr. externý zásobník, integrovaný v jednotke)?

## Turn 4

User: Bratislava, nemám odhad
Pass: yes
responseTimeMs: 16183
answerMode: rag_answer
serviceType: heat_pump
serviceIntent: recommendation
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 projekt energeticky certifikat tepelna strata chyba odhad vykonu služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie tepelná strata alebo odhad nie je k dispozícii počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie lokalita Bratislava ahoj, aké tep. čerpadlo je najlepšie? 1. n
sources: 3

### Predbežný verdikt

Pre novostavbu s podlahovým kúrením, 120 m², 5 osobami a požiadavkou na chladenie v Bratislave, by som predbežne odporučil tepelné čerpadlo **vzduch-voda**. Tento typ je vhodný pre nízkoteplotné systémy ako podlahové kúrenie a dokáže zabezpečiť aj letné chladenie.

Keďže nemáš presný odhad tepelnej straty, budeme sa musieť oprieť o projekt domu alebo energetický certifikát. Ak ani tie nemáš k dispozícii, budeme musieť tepelnú stratu odhadnúť na základe štandardov pre novostavby v danej lokalite.

Pre komplexné riešenie a presný návrh by bolo ideálne mať k dispozícii projektovú dokumentáciu.

**Ďalšie kroky:**

* Máš k dispozícii projektovú dokumentáciu domu, kde by mohla byť uvedená tepelná strata?
* Ak nie, bol by si ochotný dohodnúť si obhliadku, aby sme mohli priestor posúdiť priamo na mieste?

## Turn 5

User: si mi nepovedal najlepšie čerpadlo pre mňa
Pass: yes
responseTimeMs: 10153
answerMode: rag_answer
serviceType: heat_pump
serviceIntent: recommendation
retrievalQuery: service router verdict gate service-card-heat-pump tepelne cerpadla tepelné čerpadlá recommendation scenar-novostavba-podlahove-kurenie novostavba podlahove kurenie nizkoteplotne vzduch-voda scenar-kurenie-aj-chladenie chladenie cez tepelne cerpadlo stropne chladenie fancoily podlahove chladenie rosny bod zasobnik TUV tepla voda pocet osob 5 projekt energeticky certifikat tepelna strata chyba odhad vykonu služba tepelné čerpadlá zámer recommendation projekt novostavba plocha 120 m2 vykurovanie podlahové kúrenie tepelná strata alebo odhad nie je k dispozícii počet osôb 5 zásobník TÚV pre 5 osôb rieši teplú vodu TÚV rieši chladenie lokalita Bratislava ahoj, aké tep. čerpadlo je najlepšie? 1. n
sources: 3

### Predbežný verdikt

Pre teba by som predbežne išiel do tepelného čerpadla **vzduch-voda** pre **novostavbu s nízkoteplotným podlahovým kúrením** pri dome cca 120 m². Dáva to zmysel hlavne preto, že podlahovka pracuje s nízkou teplotou vody, čo tepelnému čerpadlu vyhovuje.
Pri 5 osobách by som v návrhu rátal aj so **zásobníkom TÚV** primeraným spotrebe domácnosti.
Chladenie treba navrhnúť cielene: podlahové chladenie vie dom jemne ochladiť, ale má limity a treba riešiť rosný bod; komfortnejšie býva stropné chladenie, fancoily alebo klimatizácia podľa projektu.
Konkrétny výkon a model by som vybral až podľa projektu, energetického certifikátu alebo tepelnej straty.

Máš projekt, tepelnú stratu alebo energetický certifikát?

### Prečo zatiaľ nemám konkrétny model

Rozumiem, že chceš vedieť konkrétny model, ktorý je pre teba "najlepší". Chápem tvoju netrpezlivosť.

Dôvod, prečo ti zatiaľ neviem povedať presný model tepelného čerpadla, je ten, že **"najlepšie" čerpadlo neexistuje univerzálne pre každého**. Vždy závisí od veľmi konkrétnych technických parametrov tvojho domu.

Už viem, že ide o novostavbu s podlahovým kúrením, 120 m², pre 5 osôb a chceš aj chladenie. Na základe týchto informácií je **tepelné čerpadlo vzduch-voda** stále najpravdepodobnejšou a najvhodnejšou voľbou.

### Čo potrebujem na konkrétne odporúčanie

Aby som ti mohol odporučiť konkrétny model (napríklad od značiek NIBE alebo Vaillant, s ktorými máme dobré skúsenosti), potrebujem poznať **presnú tepelnú stratu tvojho domu**. Bez nej by bolo akékoľvek odporúčanie len odhadom a nemuselo by byť správne dimenzované.

Tepelná strata je kľúčový údaj, ktorý určuje potrebný výkon čerpadla. Zvyčajne je uvedená v projekte domu alebo v energetickom certifikáte.
