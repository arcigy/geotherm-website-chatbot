# Sales Flow Test Report

Generated: 2026-05-07T20:41:42.926Z

## Summary

- total scenarios: 5
- passed: 5
- failed: 0
- verdict: PASS

## Scenarios

| ID | Scenario | Pass | Final intent | Lead captured | Lead score | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| A | Quote lead | yes | contact | yes | 75 | - |
| B | Service lead | yes | contact | yes | 40 | - |
| C | Subsidy inquiry | yes | subsidy | no | 30 | - |
| D | Irrelevant | yes | irrelevant | no | 0 | - |
| E | Contact | yes | contact | no | 20 | - |

## Conversation Samples

### A Quote lead

User: Chcem cenovú ponuku na tepelné čerpadlo
Assistant intent=quote confidence=high lead=no
Podľa nájdených informácií na webe: - Chcem vyplniť podrobné informácie o stavbe Novostavba - vyplním podrobné údaje o stavbeRekonštrukcia - vyplním podrobné údaje o stavbe Novostavba - vyplním podrobné údaje o stavbeRekonštrukcia - vyplním podrobné údaje o stavbe Podrobné informácie o stavbe Pre kvalitný návrh potrebujeme dostatok informácií. Vyplňte prosím informácie, ktoré poznáte. Ďakujeme z - na tepelné čerpadlá

User: Dom má 160 m2 v Žiline
Assistant intent=product confidence=high lead=no
Podľa nájdených informácií na webe: - cha Immaculaty v životnej veľkosti. Jej zvláštnosťou je, že má tvár spredu i zozadu, aby žiadnemu Trnavčanovi nebola otočená chrbtom. V ekologickom dome so solárnymi panelmi a nabíjacou stanicou sa nájde miesto aj pre parádny „elektromobil“ Octan-E. Dom ponúka veľa dobre vybavených izieb, vrátane kuchyne s prístrojom na smoothie a kúpeľňou s toaletou, umývad - Nový pútnický dom n

User: Volám sa Peter, email peter@example.com, tel 0903123456
Assistant intent=contact confidence=medium lead=yes
Ďakujem, mám to. Odovzdám dopyt technikovi/obchodníkovi. Ak treba, doplním k nemu aj kontext z tejto konverzácie.

### B Service lead

User: Potrebujem servis tepelného čerpadla
Assistant intent=service confidence=high lead=no
Podľa nájdených informácií na webe: - Raz za rok potrebuje dôkladnú kontrolu každý vykurovací systém. Počas vykurovacej sezóny od bezchybného chodu tepelného čerpadla závisí komfort všetkých členov domácnosti. Preto je dôležité servis vykonať ešte pred začiatkom vykurovacej sezóny, aby sa odhalili a odstránili prípadné nedostatky. Pravidelným servisom a údržbou predídete zvýšenej spotrebe energi - Aj kvalitné tepelné

User: Som Jana, email jana@example.com, tel 0903555666
Assistant intent=contact confidence=medium lead=yes
Ďakujem, mám to. Odovzdám dopyt technikovi/obchodníkovi. Ak treba, doplním k nemu aj kontext z tejto konverzácie.

### C Subsidy inquiry

User: Vybavujete dotácie?
Assistant intent=subsidy confidence=high lead=no
Podľa nájdených informácií na webe: - replatená. Zelená domácnostiam ponúka domácnostiam až 50 % z oprávnených výdavkov na technológie, ako sú tepelné čerpadlá či solárne panely. Dotácie sú dostupné pre široké spektrum domácností – od novostavieb až po staršie rodinné domy. Mnohí žiadatelia však musia počítať s dlhšou čakacou dobou, keďže žiadostí je veľa a podľa SIEA často obsahujú chyby zo str - V posledných dňoch 

### D Irrelevant

User: Aké bude zajtra počasie?
Assistant intent=irrelevant confidence=low lead=no
Na webe som nenašiel dostatočne jasnú odpoveď na túto otázku. Skúste sa opýtať konkrétnejšie na tepelné čerpadlá, servis, dotácie, montáž, hlučnosť alebo kontakt.

### E Contact

User: Ako vás kontaktujem?
Assistant intent=contact confidence=medium lead=no
Podľa dostupných informácií web uvádza, ale výsledok berte ako menej istý: - ww.geotherm.sk Ak máte otázky ohľadom našich produktov, potrebujete poradiť, alebo nám len chcete povedať svoj názor neváhajte nás kontaktovať: pevná linka: +421 33 551 1819 e-mail: geotherm@geotherm.sk - : +421 905 665 755 || WhatsApp: +421 905 665 755 || e-mail: sturdik@geotherm.sk Navrhnem Vám moderné a úsporné vykurovanie / vetranie / ch
