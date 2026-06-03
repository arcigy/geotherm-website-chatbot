# Sales Flow Test Report

Generated: 2026-06-03T10:16:09.563Z

## Summary

- total scenarios: 5
- passed: 5
- failed: 0
- verdict: PASS

## Behavior Checks

| ID | Scenario | Pass | Final intent | Lead captured | Lead score | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| A | Noise advice without contact push | yes | noise | no | 10 | - |
| B | Price advice without first-turn contact request | yes | quote | no | 10 | - |
| C | Long advisory conversation reaches soft handoff | yes | product | no | 30 | - |
| D | Lead captured only after explicit contact | yes | contact | yes | 55 | - |
| E | Irrelevant fallback without qualification | yes | unknown | no | 0 | - |

## Conversation Samples

### A Noise advice without contact push

User: Aké hlučné je NIBE?
Assistant intent=noise confidence=high lead=no
### Hlučnosť NIBE Pri NIBE sa hlučnosť nedá hodnotiť jedným číslom pre všetky modely. Záleží od konkrétnej jednotky, výkonu, režimu, umiestnenia pri dome, podstavca a nočného režimu. Pri výbere by som porovnal aktuálnu zostavu podľa technického listu a montážnych možností, nie iba podľa značky. Kde by mala byť vonkajšia jednotka umiestnená voči obytným miestnostiam alebo susedom?

### B Price advice without first-turn contact request

User: Koľko stojí tepelné čerpadlo?
Assistant intent=quote confidence=high lead=no
Cena tepelného čerpadla sa líši v závislosti od mnohých faktorov, ako je jeho výkon, typ vykurovacieho systému (radiátory alebo podlahové kúrenie), potreba ohrevu TÚV, regulácia, elektropráce a samotná montáž. Je dôležité rozlišovať cenu samotného zariadenia a cenu kompletnej realizácie. Pre aký účel by ste tepelné čerpadlo potrebovali. Ide o novostavbu, výmenu starého zdroja, alebo servis existujúceho zariadenia?

### C Long advisory conversation reaches soft handoff

User: Koľko stojí tepelné čerpadlo?
Assistant intent=quote confidence=high lead=no
### Cena vrátane inštalácie konkrétnu cenu bez konkrétnej ponuky nepotvrdím. Pri tepelnom čerpadle treba rozlíšiť cenu samotnej zostavy a cenu kompletnej realizácie. Pri tepelnom čerpadle cenu ovplyvňuje výkon, radiátory alebo podlahovka, TÚV zásobník, regulácia, montážny materiál, úpravy kotolne, elektropráce, uvedenie do prevádzky a prípadná akumulačná nádrž. Ak máte v ruke cenu, najdôležitejšie je porovnať rozsah: čo je zahrnuté, čo je príplatok a čo sa bude riešiť až po obhliadke alebo návrhu. Ide o nové tepeln

User: Dom má 160 m2
Assistant intent=quote confidence=high lead=no
Pre váš dom s rozlohou 160 m2 je cena tepelného čerpadla individuálna. Záleží na výkone, typu vykurovania (radiátory/podlahovka), potrebe ohrevu TÚV, regulácii a rozsahu prác vrátane elektroinštalácie a úprav kotolne. Cena samotného zariadenia sa líši od ceny kompletnej realizácie. Ak máte už konkrétnu ponuku, porovnajte si, čo všetko je v cene zahrnuté. Ide o nové tepelné čerpadlo, výmenu starého zdroja alebo servis?

User: Som zo Žiliny
Assistant intent=installation confidence=medium lead=no
### Lokalita Lokalitu treba pri servise alebo montáži potvrdiť podľa konkrétnej služby a kapacity technika. Ak ide o servis, k mestu pridajte značku/model alebo fotku štítku a problém; ak ide o ponuku, stačí lokalita, typ domu a čo chcete riešiť.

User: Chcel by som vedieť čo odporúčate
Assistant intent=product confidence=medium lead=no
Pre váš dom s rozlohou 160 m2 v Žiline by som ako prvý smer riešil **tepelné čerpadlo vzduch-voda**. Je to najpraktickejšie riešenie pre rodinné domy. Konkrétny typ a výkon však závisia od toho, či máte podlahové kúrenie alebo radiátory, ako aj od vašej aktuálnej spotreby a potreby ohrevu teplej úžitkovej vody. Chceli by ste sa poradiť s odborníkom na presné nacenenie a návrh? Ak chcete, môžeme to posunúť odborníkovi na konzultáciu a nacenenie; kontakt by sa riešil až vtedy, keď poviete, že chcete, aby sa vám obcho

### D Lead captured only after explicit contact

User: Áno, nech ma kontaktujú. Môj email je peter@example.com
Assistant intent=contact confidence=high lead=yes
### Kontakt mám poznačený Ďakujem, kontakt som si poznačil. Kolega sa vám ozve, aby s vami dohodol ďalší postup. Pre istotu: evidujem, že riešime tepelné čerpadlá.

### E Irrelevant fallback without qualification

User: Aké bude počasie?
Assistant intent=unknown confidence=low lead=no
Ako Geotherm sa zameriavam na témy súvisiace s geotermálnou energiou. Podkladom pre moje odpovede sú informácie o tejto oblasti.
