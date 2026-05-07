# Conversation Behavior Report

Generated: 2026-05-07T20:56:29.195Z

## Summary

- total scenarios: 5
- passed: 5
- failed: 0
- verdict: PASS

## Behavior Checks

| ID | Scenario | Pass | Final intent | Lead captured | Lead score | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| A | Noise advice without contact push | yes | noise | no | 0 | - |
| B | Price advice without first-turn contact request | yes | quote | no | 40 | - |
| C | Long advisory conversation reaches soft handoff | yes | quote | no | 65 | - |
| D | Lead captured only after explicit contact | yes | contact | yes | 75 | - |
| E | Irrelevant fallback without qualification | yes | irrelevant | no | 0 | - |

## Conversation Samples

### A Noise advice without contact push

User: Aké hlučné je NIBE?
Assistant intent=noise confidence=high lead=no
Podľa nájdených informácií na webe: - u pri vykurovaní miestností, 35/55 °C A+++ Tichý režim Tepelné čerpadlo je možné prepnúť do „tichého režimu“, ktorý znižuje jeho hlučnosť. Táto funkcia sa hodí v prípade, že S2125 musí byť umiestnený v priestoroch citlivých na hluk. Mala by sa používať iba po obmedzenú dobu(v nočných hodinách), pretože S2125 v tomto režime nemôže dosiahnuť dimenzovaného výko - ta. Pred zariadením musí byť aspoň 1 000 mm voľného miesta pre budúce servisné účely. Hladina akustického tlaku Tepelné

### B Price advice without first-turn contact request

User: Koľko stojí tepelné čerpadlo?
Assistant intent=quote confidence=high lead=no
Podľa nájdených informácií na webe: - až päťkrát účinnejšie! Pri použití bežných kotlov vzniká z 1 kWh vstupnej energie cca 1 kWh výstupnej energie. Pri použití tepelného čerpadla vzduch-voda sa z 1 kWh vstupnej energie priemerne využije 3 kWh výstupnej energie. Nižšia spotreba energie TČ vzduch-voda sa prejavuje na prevádzkových nákladoch a dopade na životné prostredie. Inštaláciou tepelného če - Ak chcete využiť zľavu na tepelné čerpadlá Vaillant v roku 2026, neváhajte nás kontaktovať čo najskôr. Radi vám priprav

### C Long advisory conversation reaches soft handoff

User: Koľko stojí tepelné čerpadlo?
Assistant intent=quote confidence=high lead=no
Podľa nájdených informácií na webe: - až päťkrát účinnejšie! Pri použití bežných kotlov vzniká z 1 kWh vstupnej energie cca 1 kWh výstupnej energie. Pri použití tepelného čerpadla vzduch-voda sa z 1 kWh vstupnej energie priemerne využije 3 kWh výstupnej energie. Nižšia spotreba energie TČ vzduch-voda sa prejavuje na prevádzkových nákladoch a dopade na životné prostredie. Inštaláciou tepelného če - Ak chcete využiť zľavu na tepelné čerpadlá Vaillant v roku 2026, neváhajte nás kontaktovať čo najskôr. Radi vám priprav

User: Dom má 160 m2
Assistant intent=product confidence=high lead=no
Podľa nájdených informácií na webe: - cha Immaculaty v životnej veľkosti. Jej zvláštnosťou je, že má tvár spredu i zozadu, aby žiadnemu Trnavčanovi nebola otočená chrbtom. V ekologickom dome so solárnymi panelmi a nabíjacou stanicou sa nájde miesto aj pre parádny „elektromobil“ Octan-E. Dom ponúka veľa dobre vybavených izieb, vrátane kuchyne s prístrojom na smoothie a kúpeľňou s toaletou, umývad - Nový pútnický dom nahradil staršiu už na tento účel nevyhovujúcu stavbu. Novostavba poskytuje potrebné zázemie pre pútn

User: Som zo Žiliny
Assistant intent=subsidy confidence=medium lead=no
Podľa dostupných informácií web uvádza, ale výsledok berte ako menej istý: - ákazníkom finančnú podporu až do výšky 1 700 € na vybrané modely tepelných čerpadiel. Táto špeciálna akcia pochádza priamo zo Švédska a je navrhnutá tak, aby sprístupnila kvalitné a ekologické riešenia vykurovania za ešte výhodnejších podmienok. Do kampane sa môžete zapojiť od 19. mája do 13. júla 2025, prípadne do vyčerpania zásob. Počet zvýhodnených zariad - PRODUKT/ZOSTAVA TYP AMS 10-6 + LUCIE vzduch-voda AMS 10-8 + LUCIE vzduch-voda AM

User: Chcel by som vedieť čo odporúčate
Assistant intent=quote confidence=medium lead=no
Podľa dostupných informácií web uvádza, ale výsledok berte ako menej istý: - Ak zvažujete tepelné čerpadlo do novostavby alebo pri rekonštrukcii, stačí, ak nám pošlete: projekt domu alebo pôdorys stručný popis aktuálneho stavu (novostavba / starší dom, radiátory / podlahovka) vaše predstavy (iba kúrenie, aj chladenie, rekuperácia…) Pripravíme vám návrh riešenia a orientačný rozpočet tak, aby tepelné čerpadlo nebolo len „krabica v tec - šľa dopredu. Funguje, kúri, ale horšie reaguje na výkyvy počasia. V praxi to môž

### D Lead captured only after explicit contact

User: Áno, nech ma kontaktujú. Môj email je peter@example.com
Assistant intent=contact confidence=medium lead=yes
Ďakujem, mám to. Odovzdám dopyt technikovi/obchodníkovi. Ak treba, doplním k nemu aj kontext z tejto konverzácie.

### E Irrelevant fallback without qualification

User: Aké bude počasie?
Assistant intent=irrelevant confidence=low lead=no
Na webe som nenašiel dostatočne jasnú odpoveď na túto otázku. Skúste sa opýtať konkrétnejšie na tepelné čerpadlá, servis, dotácie, montáž, hlučnosť alebo kontakt.
