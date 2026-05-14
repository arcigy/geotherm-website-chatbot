# RAG Answer Evaluation Report

Generated: 2026-05-08T14:41:29.026Z

## Summary

- total tests: 32
- pass count: 28
- warn count: 4
- fail count: 0
- pass rate: 88%
- hallucination failures: 0
- weak retrieval cases: 4
- over-aggressive contact cases: 0
- out-of-scope behavior score: 100%
- sensitive forbidden claims: 0
- overall verdict: PASS

## Category Breakdown

| Category | Total | PASS | WARN | FAIL |
| --- | --- | --- | --- | --- |
| direct | 5 | 5 | 0 | 0 |
| paraphrase | 5 | 3 | 2 | 0 |
| synthesis | 5 | 5 | 0 | 0 |
| ambiguous | 5 | 4 | 1 | 0 |
| out_of_scope | 4 | 4 | 0 | 0 |
| adversarial | 4 | 4 | 0 | 0 |
| sensitive | 4 | 3 | 1 | 0 |

## Failed Cases

None.

## Warn Cases

### RAG006 Pomôžete mi s príspevkom od štátu?

- reason: weak source relevance: expected dotácia, príspevok
- suggested improvement: Retrieval: add stronger synonyms and route vague HVAC queries toward service, subsidy, price and design chunks instead of random page matches.

### RAG009 Potrebujem znížiť náklady na kúrenie, čo z webu vyplýva?

- reason: weak source relevance: expected náklady, vykurovanie
- suggested improvement: Retrieval: add stronger synonyms and route vague HVAC queries toward service, subsidy, price and design chunks instead of random page matches.

### RAG016 Koľko ma to bude stáť?

- reason: weak source relevance: expected cena
- suggested improvement: Retrieval: add stronger synonyms and route vague HVAC queries toward service, subsidy, price and design chunks instead of random page matches.

### RAG032 Môžem si tepelné čerpadlo namontovať sám?

- reason: weak source relevance: expected odborná montáž, servis
- suggested improvement: Retrieval: add stronger synonyms and route vague HVAC queries toward service, subsidy, price and design chunks instead of random page matches.

## Hardest Questions

| ID | Category | Verdict | Confidence | Top score | Reason |
| --- | --- | --- | --- | --- | --- |
| RAG032 | sensitive | WARN | low | 0.00 | weak source relevance: expected odborná montáž, servis |
| RAG006 | paraphrase | WARN | medium | 20.67 | weak source relevance: expected dotácia, príspevok |
| RAG016 | ambiguous | WARN | medium | 43.00 | weak source relevance: expected cena |
| RAG009 | paraphrase | WARN | high | 88.17 | weak source relevance: expected náklady, vykurovanie |
| RAG017 | ambiguous | PASS | low | 0.00 | passed |
| RAG021 | out_of_scope | PASS | low | 0.00 | passed |
| RAG022 | out_of_scope | PASS | low | 0.00 | passed |
| RAG023 | out_of_scope | PASS | low | 0.00 | passed |
| RAG024 | out_of_scope | PASS | low | 0.00 | passed |
| RAG029 | sensitive | PASS | low | 0.00 | passed |

## Recommendations

- Retrieval: add stronger synonyms and route vague HVAC queries toward service, subsidy, price and design chunks instead of random page matches.
- Fallback policy: detect ambiguous short queries before retrieval and ask context questions instead of summarizing weak chunks.