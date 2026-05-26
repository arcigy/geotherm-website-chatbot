# Retrieval Evaluation Report

## Summary

- total test cases: 42
- top1 pass rate: 62%
- top3 pass rate: 79%
- fallback pass rate: 83%
- average top score: 138.75
- verdict: NEEDS WORK

Confidence thresholds: `finalScore >= 35` is confident, `14-34.99` is uncertain, `< 14` is no answer.

## Category Breakdown

| Category | Cases | Top1 | Top3 | Fallback |
| --- | --- | --- | --- | --- |
| produkty | 10 | 100% | 100% | n/a |
| cena | 5 | 40% | 40% | n/a |
| dotácie | 5 | 60% | 100% | n/a |
| servis | 4 | 50% | 100% | n/a |
| montáž | 4 | 50% | 100% | n/a |
| hlučnosť | 4 | 50% | 50% | n/a |
| kontakt | 4 | 75% | 100% | n/a |
| fallback | 6 | 33% | 33% | 83% |

## Failed Cases

### T011 Je dostupný cenník pre vykurovanie?

- category: cena
- expectedTerms: cenová ponuka, cena
- expectedUrlIncludes: cenova-ponuka
- reason: Expected terms/URL not found in top 3 results.

1. 182.83 confident | Cena tepelneho cerpadla a kompletnej realizacie | Cena zariadenia verzus realizacia na kluc | manual://geotherm/cena-tepelneho-cerpadla-kompletna-realizacia<br>2. 169.33 confident | Scenar novostavba s podlahovym kurenim | Novy dom, podlahovka, tepla voda a nizka teplota vody | manual://geotherm/scenar-novostavba-podlahove-kurenie<br>3. 162 confident | Scenar kurenie aj chladenie | Tepelne cerpadlo, stropne chladenie, fancoily a komfort | manual://geotherm/scenar-kurenie-aj-chladenie<br>4. 154.5 confident | Dotácie a financovanie riešení | Dotácie, príspevky a orientačná cena | manual://geotherm/manual-dotacie-financovanie-rieseni<br>5. 151.33 confident | Scenar starsi dom s radiatormi a plynom | Typicka vymena plynoveho kotla | manual://geotherm/scenar-starsi-dom-radiatory-plyn

### T012 Ako získam cenovú ponuku na vykurovanie?

- category: cena
- expectedTerms: cenová ponuka
- expectedUrlIncludes: cenova-ponuka
- reason: Expected terms/URL not found in top 3 results.

1. 188.75 confident | Cena tepelneho cerpadla a kompletnej realizacie | Cena zariadenia verzus realizacia na kluc | manual://geotherm/cena-tepelneho-cerpadla-kompletna-realizacia<br>2. 168.75 confident | Scenar novostavba s podlahovym kurenim | Novy dom, podlahovka, tepla voda a nizka teplota vody | manual://geotherm/scenar-novostavba-podlahove-kurenie<br>3. 162 confident | Scenar kurenie aj chladenie | Tepelne cerpadlo, stropne chladenie, fancoily a komfort | manual://geotherm/scenar-kurenie-aj-chladenie<br>4. 154.5 confident | Dotácie a financovanie riešení | Dotácie, príspevky a orientačná cena | manual://geotherm/manual-dotacie-financovanie-rieseni<br>5. 150.75 confident | Scenar starsi dom s radiatormi a plynom | Typicka vymena plynoveho kotla | manual://geotherm/scenar-starsi-dom-radiatory-plyn

### T013 Aké sú náklady na servis tepelného čerpadla?

- category: cena
- expectedTerms: servis, cena
- expectedUrlIncludes: servis
- reason: Expected terms/URL not found in top 3 results.

1. 259.5 confident | Spotreba elektriny a uspora | Ucty, navratnost a prevadzkove naklady | manual://geotherm/spotreba-elektriny-uspora-navratnost<br>2. 253.5 confident | Scenar fotovoltaika a tepelne cerpadlo | Kombinacia s vlastnou vyrobou elektriny | manual://geotherm/scenar-fotovoltaika-tepelne-cerpadlo<br>3. 241.5 confident | Cena tepelneho cerpadla a kompletnej realizacie | Cena zariadenia verzus realizacia na kluc | manual://geotherm/cena-tepelneho-cerpadla-kompletna-realizacia<br>4. 224 confident | Scenar kurenie aj chladenie | Tepelne cerpadlo, stropne chladenie, fancoily a komfort | manual://geotherm/scenar-kurenie-aj-chladenie<br>5. 186.75 confident | Servis tepelného čerpadla | Prečo je servis tepelného čerpadla dôležitý | http://www.geotherm.sk/tepelne-cerpadlo-servis/

### T027 Je tepelné čerpadlo hlučné?

- category: hlučnosť
- expectedTerms: hlučnosť, hluk
- expectedUrlIncludes: vzduch-voda
- reason: Expected terms/URL not found in top 3 results.

1. 185.17 confident | Hlučnosť tepelného čerpadla vzduch-voda | Hlučnosť tepelného čerpadla vzduch-voda | http://www.geotherm.sk/hlucnost-tepelneho-cerpadla-vzduch/<br>2. 185.17 confident | Hlučnosť tepelného čerpadla vzduch-voda | Hlučnosť tepelného čerpadla vzduch-voda | http://www.geotherm.sk/hlucnost-tepelneho-cerpadla-vzduch/<br>3. 147 confident | Umiestnenie, hlučnosť a veľkosť tepelného čerpadla – Vaillant showPOINT | Lepšie znázornenie tepelných čerpadiel vďaka aplikácii showPOINT | http://www.geotherm.sk/hlucnost-velkost-a-umiestnenie-tepelneho-cerpadla-vaillant-showpoint/<br>4. 147 confident | Umiestnenie, hlučnosť a veľkosť tepelného čerpadla – Vaillant showPOINT | Ako môže rozšírená realita pomôcť pri rozhodovaní | http://www.geotherm.sk/hlucnost-velkost-a-umiestnenie-tepelneho-cerpadla-vaillant-showpoint/<br>5. 128.67 confident | Tepelne cerpadlo k radiatorom | Radiatorovy system a vhodnost tepelneho cerpadla | manual://geotherm/tepelne-cerpadlo-k-radiatorom

### T030 Sú katalógové hodnoty hlučnosti spoľahlivé?

- category: hlučnosť
- expectedTerms: hlučnosť, katalógové hodnoty
- expectedUrlIncludes: vzduch-voda
- reason: Expected terms/URL not found in top 3 results.

1. 122.75 confident | Hlučnosť tepelného čerpadla vzduch-voda | Hlučnosť tepelných čerpadiel porovnávame v decibeloch | http://www.geotherm.sk/hlucnost-tepelneho-cerpadla-vzduch/<br>2. 117 confident | Hlučnosť tepelného čerpadla vzduch-voda | Hlučnosť tepelného čerpadla vzduch-voda | http://www.geotherm.sk/hlucnost-tepelneho-cerpadla-vzduch/<br>3. 97.5 confident | Umiestnenie, hlučnosť a veľkosť tepelného čerpadla – Vaillant showPOINT | Lepšie znázornenie tepelných čerpadiel vďaka aplikácii showPOINT | http://www.geotherm.sk/hlucnost-velkost-a-umiestnenie-tepelneho-cerpadla-vaillant-showpoint/<br>4. 97.5 confident | Umiestnenie, hlučnosť a veľkosť tepelného čerpadla – Vaillant showPOINT | Ako môže rozšírená realita pomôcť pri rozhodovaní | http://www.geotherm.sk/hlucnost-velkost-a-umiestnenie-tepelneho-cerpadla-vaillant-showpoint/<br>5. 83.25 confident | Tepelné čerpadlo vzduch-voda: Rýchly prehľad | Hlučnosť: katalógové hodnoty nestačia | http://www.geotherm.sk/tepelne-cerpadlo-vzduch-voda-rychly-prehlad/

### T037 Ktoré auto má najnižšiu spotrebu?

- category: fallback
- expectedTerms: 
- expectedUrlIncludes: n/a
- reason: Fallback query returned confident result with score 113.5.

1. 113.5 confident | Spotreba elektriny a uspora | Ucty, navratnost a prevadzkove naklady | manual://geotherm/spotreba-elektriny-uspora-navratnost<br>2. 20.83 uncertain | Scenar fotovoltaika a tepelne cerpadlo | Kombinacia s vlastnou vyrobou elektriny | manual://geotherm/scenar-fotovoltaika-tepelne-cerpadlo<br>3. 11.33 no_answer | Scenar starsi dom s radiatormi a plynom | Typicka vymena plynoveho kotla | manual://geotherm/scenar-starsi-dom-radiatory-plyn<br>4. 5 no_answer | Cena tepelneho cerpadla a kompletnej realizacie | Cena zariadenia verzus realizacia na kluc | manual://geotherm/cena-tepelneho-cerpadla-kompletna-realizacia<br>5. 5 no_answer | Scenar novostavba s podlahovym kurenim | Novy dom, podlahovka, tepla voda a nizka teplota vody | manual://geotherm/scenar-novostavba-podlahove-kurenie

## Weak Areas

- fallback: top3 33%, fallback 83%.
- cena: top3 40%, fallback n/a.
- hlučnosť: top3 50%, fallback n/a.

Likely failure causes: missing source content for some brand-specific questions, sparse contact/email chunks, and lexical limits without embeddings.

## Recommendations

- Add explicit brand pages or metadata for brands that are offered but absent from the content.
- Add a small curated contact chunk if the public export has weak phone/email coverage.
- Keep this lexical engine as a deterministic baseline before adding embeddings.
- Re-run evaluation after every knowledge rebuild.
