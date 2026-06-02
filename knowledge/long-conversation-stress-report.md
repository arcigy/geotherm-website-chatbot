# Long Conversation Stress Report

## Summary
- scenarios: 3
- turns: 61
- pass turns: 59
- warnings: 1
- failures: 1
- hallucinations: 0
- repetitive answers: 1
- contact aggression: 0
- source degradation: 0
- context drift: 0

## Scenario Issues
| scenario | message | confidence | intent | issues | answer |
| --- | --- | --- | --- | --- | --- |
| LC02 | ako vás kontaktujem | medium | contact | repetitive answer | ### Spojenie s Geotherm Otvor oficiálnu stránku Geotherm a použi časť určenú na spojenie s firmou. Číslo ani adresu tu radšej neprepisujem, aby si išiel podľa aktuálnych údajov. Mini-osnova oslovenia: predmet, preferova |
| LC03 | mám rozpočet 5k čo odporúčate | high | product | sensitive/cautious turn was overconfident | Rozpočet by som riešil až pri cenovej ponuke; teraz je dôležitý správny technický smer. Rozpočet by som riešil až pri cenovej ponuke; teraz je dôležitý správny technický smer. Cena tepelného čerpadla a jeho kompletnej r |

## Assessment
The long-conversation behavior is not production safe. Failures must be reviewed before client deployment.
