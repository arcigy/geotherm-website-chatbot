# Conversation Behavior Report

Generated: 2026-05-08T18:25:44.421Z

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
| C | Long advisory conversation reaches soft handoff | yes | product | no | 55 | - |
| D | Lead captured only after explicit contact | yes | contact | yes | 75 | - |
| E | Irrelevant fallback without qualification | yes | irrelevant | no | 0 | - |

## Conversation Samples

### A Noise advice without contact push

User: Aké hlučné je NIBE?
Assistant intent=noise confidence=medium lead=no
Hlučnosť moderných tepelných čerpadiel NIBE je porovnateľná s umývačkou riadu, okolo 45 dB. - Pri NIBE aj iných značkách je dôležitý správny výkon pre konkrétny dom. - Hlučnosť je spôsobená ventilátorom a kompresorom. - Problémy s hlučnosťou boli častejšie pri starších a lacnejších typoch. - Moderné čerpadlá majú nízkootáčkové ventilátory a antivibračné rámy pre zníženie hluku. _Kde by mala byť vonkajšia jednotka umiestnená - pri obytných miestnostiach alebo skôr bokom od domu?_ **Zdroje:** - [Hlučnosť tepelného če

### B Price advice without first-turn contact request

User: Koľko stojí tepelné čerpadlo?
Assistant intent=quote confidence=high lead=no
Cena tepelného čerpadla sa líši v závislosti od konkrétneho modelu a jeho výkonu. - Tepelné čerpadlo vzduch-voda aroTHERM plus s ohrevom TUV v zostave VWL 35/6 A + modul MEH97/5 + VRC720 stojí po zľave 6 450 €. - Tepelné čerpadlo vzduch-voda aroTHERM split v zostave VWL 35/5 AS 230V + modul + VRC720 stojí po zľave 5 800 €. - Výrobca NIBE ponúka bonus až 1 700 € na vybrané modely tepelných čerpadiel. _Pre aký objekt to riešiš - rodinný dom, byt alebo firemný priestor?_ **Zdroje:** - [Tepelné čerpadlo – akcia – výhod

### C Long advisory conversation reaches soft handoff

User: Koľko stojí tepelné čerpadlo?
Assistant intent=quote confidence=high lead=no
Cena tepelného čerpadla sa líši v závislosti od konkrétneho modelu a jeho výkonu. - Tepelné čerpadlo vzduch-voda aroTHERM plus s ohrevom TUV v zostave VWL 35/6 A + modul MEH97/5 + VRC720 stojí po akciovej zľave 6 450 €. - Tepelné čerpadlo vzduch-voda aroTHERM split v zostave VWL 35/5 AS 230V + modul + VRC720 stojí po akciovej zľave 5 800 €. - Výrobca NIBE ponúka bonus až 1 700 € na vybrané modely tepelných čerpadiel v rámci špeciálnej akcie. _Pre aký objekt to riešiš - rodinný dom, byt alebo firemný priestor?_ **Zd

User: Dom má 160 m2
Assistant intent=quote confidence=high lead=no
Pri výbere tepelného čerpadla by som nezačínal iba názvom modelu. Najprv treba trafiť typ systému, výkon, hlučnosť, montáž a servis podľa konkrétneho domu. - Cena závisí od typu objektu, tepelných strát, rozsahu montáže a zvoleného riešenia. _Pre aký objekt to riešiš - rodinný dom, byt alebo firemný priestor?_ **Zdroje:** - [Tepelné čerpadlo – akcia – výhodná cena](http://www.geotherm.sk/tepelne-cerpadlo-akcia-vyhodna-cena/) - [Tepelné čerpadlo vzduch-voda](http://www.geotherm.sk/referencie/tepelne-cerpadla/tepelne

User: Som zo Žiliny
Assistant intent=product confidence=high lead=no
Pri výbere tepelného čerpadla je dôležité zohľadniť viacero faktorov ako len model. Potrebujeme poznať typ systému, výkon, hlučnosť, ako aj možnosti montáže a servisu pre tvoj konkrétny dom. - Cena tepelného čerpadla závisí od mnohých aspektov, vrátane tepelných strát objektu a rozsahu montáže. - Je dôležité vybrať riešenie, ktoré zodpovedá tvojmu domu, rozpočtu, požiadavkám na hlučnosť a očakávanému komfortu. - Výrobca NIBE ponúka bonus až 1 700 € na vybrané modely tepelných čerpadiel v rámci špeciálnej akcie do 1

User: Chcel by som vedieť čo odporúčate
Assistant intent=product confidence=high lead=no
Pri výbere tepelného čerpadla by som nezačínal iba názvom modelu. Najprv treba trafiť typ systému, výkon, hlučnosť, montáž a servis podľa konkrétneho domu. - Výber riešenia má sedieť k domu, rozpočtu, hlučnosti, servisu a očakávanému komfortu. _Riešiš to pre nový projekt alebo chceš upraviť existujúce kúrenie?_ **Zdroje:** - [Tepelné čerpadlo vzduch-voda](http://www.geotherm.sk/referencie/tepelne-cerpadla/tepelne-cerpadla-vzduch-voda/) - [6 tipov, ako si správne vybrať tepelné čerpadlo do rodinného domu](http://www

### D Lead captured only after explicit contact

User: Áno, nech ma kontaktujú. Môj email je peter@example.com
Assistant intent=contact confidence=high lead=yes
### Mám to, ďakujem Odovzdám dopyt technikovi alebo obchodníkovi a priložím aj kontext z tejto konverzácie. **Zhrnutie pre tím:** Zákazník z Žiliny s rodinným domom o rozlohe 160 m2 hľadá odporúčanie na tepelné čerpadlo a požiadal o kontakt emailom.

### E Irrelevant fallback without qualification

User: Aké bude počasie?
Assistant intent=irrelevant confidence=low lead=no
Na toto nemám dostatočne jasný podklad v obsahu webu. - Viem ti pomôcť hlavne s vykurovaním, chladením, tepelnými čerpadlami, servisom, montážou alebo dotáciami. _Chceš riešiť vykurovanie, chladenie alebo tepelné čerpadlo?_
