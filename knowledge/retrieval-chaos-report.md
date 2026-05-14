# Retrieval Chaos Report

Generated: 2026-05-07T22:19:14.545Z

## Summary

- total: 20
- pass/warn/fail: 17/2/1
- top1 relevance: 90%
- top3 diversity: 100%
- false positive rate: 5%
- irrelevant source contamination: 10%
- overconfident wrong retrievals: 1
- retrieval drift incidents: 0

## Cases

| ID | Category | Verdict | Top confidence | Top source | Query |
| --- | --- | --- | --- | --- | --- |
| C001 | typo_tolerance | PASS | confident | Výročná dotácia na tepelné čerpadlá Vaillant 2026 | tepelne cerpadllo cenov ponukaa |
| C002 | typo_tolerance | PASS | confident | Servis tepelného čerpadla | serivs cerpadla hluci |
| C003 | typo_tolerance | PASS | confident | Dotácie Zelená domácnostiam podmienky podpory pre rodinné domy | dotacii prispevokk stat |
| C004 | synonym_robustness | PASS | confident | Servis | udrzba zariadenia pred zimou |
| C005 | synonym_robustness | PASS | confident | Dotácie na OZE bez obáv: Ako fungujeme my v GEOTHERM Slovakia | podpora od statu na oze |
| C006 | multi_intent_confusion | PASS | confident | Pravidelný servis tepelného čerpadla: prečo sa oplatí a prečo ho neodkladať | dotacia servis cena cerpadlo |
| C007 | multi_intent_confusion | PASS | confident | Tepelné čerpadlo SPLIT | nibe hluk cena servis |
| C008 | vague_queries | PASS | uncertain | Vírenie prachu vykurovaním | co s tym |
| C009 | vague_queries | FAIL | confident | Pravidelný servis tepelného čerpadla: prečo sa oplatí a prečo ho neodkladať | oplati sa |
| C010 | conflicting_keywords | WARN | uncertain | Ako rozmýšľať nad značkou, cenou a dodávateľom tepelného čerpadla | najlacnejsie najtichsie najvykonnejsie |
| C011 | source_collisions | PASS | confident | Odborný návrh vykurovania – rekonštrukcia | kontakt cena navrh vykurovania |
| C012 | boilerplate_dominance | WARN | confident | Ochrana osobných údajov | kontakt ochrana osobnych udajov formular |
| C013 | generic_retrieval | PASS | none | - | poradte mi investovanie do akcii |
| C014 | generic_retrieval | PASS | none | - | ake auto mam kupit |
| C015 | retrieval_drift | PASS | confident | Pravidelný servis tepelného čerpadla: prečo sa oplatí a prečo ho neodkladať | servis tepelneho cerpadla zaruka vaillant |
| C016 | retrieval_drift | PASS | confident | Podlahové kúrenie cena | podlahove kurenie cena skladba |
| C017 | mixed_language | PASS | confident | Tepelné čerpadlo voda-voda | heat pump subsidy Slovakia |
| C018 | mixed_language | PASS | confident | Tepelné čerpadlo NIBE S2125 | NIBE noise tichy rezim |
| C019 | unsupported_place | PASS | none | - | pobocka praha servis |
| C020 | unsupported_finance | PASS | none | - | bitcoin etf hypoteky |