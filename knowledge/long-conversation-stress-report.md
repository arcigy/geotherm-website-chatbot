# Long Conversation Stress Report

## Summary
- scenarios: 3
- turns: 61
- pass turns: 56
- warnings: 5
- failures: 0
- hallucinations: 0
- repetitive answers: 5
- contact aggression: 0
- source degradation: 0
- context drift: 0

## Scenario Issues
| scenario | message | confidence | intent | issues | answer |
| --- | --- | --- | --- | --- | --- |
| LC02 | čo s tým | high | service | repetitive answer | ### Servisný smer Rozumiem, zariadenie hlási chybu. Pri poruche by som neradil žiadny svojpomocný zásah do zariadenia; najprv treba zistiť presný model, chybový kód a lokalitu, aby sa dalo posúdiť, či ide o servisný zás |
| LC02 | ok, tak len zhrňte čo vieme | high | contact | repetitive answer | ### Zhrnutie bez ďalšieho dotazníka Máte pravdu, v tejto fáze už nemá zmysel pridávať ďalší dotazník. Bezpečný záver je: ak ide o servis, treba potvrdiť zariadenie, problém a lokalitu; ak ide o nové riešenie, treba krát |
| LC02 | to je celé? | high | contact | repetitive answer | ### Zhrnutie bez ďalšieho dotazníka Máte pravdu, v tejto fáze už nemá zmysel pridávať ďalší dotazník. Bezpečný záver je: ak ide o servis, treba potvrdiť zariadenie, problém a lokalitu; ak ide o nové riešenie, treba krát |
| LC02 | ako vás kontaktujem | high | contact | repetitive answer | ### Kontakt na Geotherm Geotherm vieš kontaktovať telefonicky alebo e-mailom. Najistejšie je poslať stručne, čo riešiš, lokalitu a pri technike aj fotky alebo základné údaje; podľa toho sa dá dohodnúť konzultácia, servi |
| LC03 | je to vhodné pre môj dom vlastne byt | high | quote | repetitive answer | Ahoj! Chápem, že chceš vedieť presnú cenu. Aby sme ti vedeli dať tú najlepšiu ponuku, potrebujeme si s tebou dohodnúť osobný rozhovor. Len tak dokážeme zhodnotiť všetky špecifické potreby tvojho bytu a navrhnúť optimálne |

## Assessment
The system survived critical long-conversation checks but still has UX/retrieval warnings.
