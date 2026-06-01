# Router Test Report

Generated: 2026-06-01T16:45:03.247Z

## Summary

- total tests: 57
- passed: 57
- failed: 0
- pass rate: 100%
- verdict: PASS

## Category Breakdown

| Category | Total | Passed | Failed |
| --- | --- | --- | --- |
| general_chat | 2 | 2 | 0 |
| site_overview | 4 | 4 | 0 |
| out_of_scope | 2 | 2 | 0 |
| direct_product | 2 | 2 | 0 |
| context_reply | 9 | 9 | 0 |
| context_switch | 3 | 3 | 0 |
| contact | 2 | 2 | 0 |
| direct_price | 2 | 2 | 0 |
| direct_service | 1 | 1 | 0 |
| direct_subsidy | 1 | 1 | 0 |
| direct_installation | 1 | 1 | 0 |
| direct_noise | 1 | 1 | 0 |
| ambiguous_no_context | 1 | 1 | 0 |
| ambiguous_with_context | 3 | 3 | 0 |
| typos | 2 | 2 | 0 |
| slang | 1 | 1 | 0 |
| slang_with_context | 1 | 1 | 0 |
| prompt_injection | 1 | 1 | 0 |
| safety | 2 | 2 | 0 |
| no_false_context | 2 | 2 | 0 |
| multi_question | 2 | 2 | 0 |
| competitor | 1 | 1 | 0 |
| competitor_context | 1 | 1 | 0 |
| long_message | 1 | 1 | 0 |
| long_context_reply | 1 | 1 | 0 |
| contact_consent | 1 | 1 | 0 |
| not_context_reply | 1 | 1 | 0 |
| greeting_plus_direct | 1 | 1 | 0 |
| greeting_plus_contact | 1 | 1 | 0 |
| service_area | 4 | 4 | 0 |

## Failed Cases

No failed cases.

## Sample Routes

| ID | Category | Needs RAG | Mode | Context | Query |
| --- | --- | --- | --- | --- | --- |
| RT001 | general_chat | false | general_chat | - | - |
| RT002 | general_chat | false | general_chat | - | - |
| RT003 | site_overview | false | general_chat | - | - |
| RT004 | site_overview | false | general_chat | - | - |
| RT005 | site_overview | false | general_chat | - | - |
| RT006 | out_of_scope | false | out_of_scope | - | - |
| RT007 | out_of_scope | false | out_of_scope | - | - |
| RT008 | direct_product | true | rag_answer | - | aké výhody má stropné chladenie? |
| RT009 | direct_product | true | rag_answer | - | rozmýšľam nad stropným chladením |
| RT010 | context_reply | true | rag_answer | stropné chladenie | stropné chladenie nad rekonštrukciou rodinného domu |
| RT011 | context_reply | true | rag_answer | stropné chladenie | stropné chladenie novostavba |
| RT012 | context_reply | true | rag_answer | NIBE tepelné čerpadlo | NIBE tepelné čerpadlo hlučnosť vonkajšia jednotka pri spálni pod oknom |
| RT013 | context_reply | true | rag_answer | tepelné čerpadlo | tepelné čerpadlo rodinný dom 160 m2 |
| RT014 | context_reply | true | rag_answer | tepelné čerpadlo | tepelné čerpadlo som zo Žiliny |
| RT015 | context_reply | true | rag_answer | servis tepelného čerpadla | servis tepelného čerpadla pravidelná údržba |
| RT016 | context_switch | true | rag_answer | - | a robíte servis tepelných čerpadiel? |
| RT017 | context_switch | true | rag_answer | - | vybavujete dotácie? |
| RT018 | context_switch | true | contact_intent | - | kontakt Geotherm telefón email adresa ako vás kontaktujem? |
| RT019 | contact | true | contact_intent | - | kontakt Geotherm telefón email adresa kde vás nájdem? |
| RT020 | contact | true | contact_intent | - | kontakt Geotherm telefón email adresa telefón alebo email? |
