# RAG Answer Evaluation Report

Generated: 2026-05-07T21:12:32.324Z

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

## Iteration History

| Round | PASS | WARN | FAIL | Pass rate | Verdict | Notes |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 1 baseline | 3 | 7 | 22 | 9% | NEEDS WORK | No hard RAG policy yet; prompt injection, weak fallback and contact noise exposed. |
| 2 guardrails | 22 | 9 | 1 | 69% | NEEDS WORK | Added adversarial/sensitive/fallback policy and removed contact pushing, but weak source matching remained. |
| 3 final | 28 | 4 | 0 | 88% | PASS | Improved snippet coverage, ambiguous follow-up handling and Slovak term matching. |

## Category Breakdown

| Category | Total | PASS | WARN | FAIL |
| --- | --- | --- | --- | --- |
| direct | 5 | 5 | 0 | 0 |
| paraphrase | 5 | 3 | 2 | 0 |
| synthesis | 5 | 3 | 2 | 0 |
| ambiguous | 5 | 5 | 0 | 0 |
| out_of_scope | 4 | 4 | 0 | 0 |
| adversarial | 4 | 4 | 0 | 0 |
| sensitive | 4 | 4 | 0 | 0 |

## Failed Cases

None.

## Warn Cases

### RAG006 Pomôžete mi s príspevkom od štátu?

- reason: weak source relevance: expected dotácia, príspevok
- suggested improvement: Retrieval: add stronger synonyms and route vague HVAC queries toward service, subsidy, price and design chunks instead of random page matches.

### RAG009 Potrebujem znížiť náklady na kúrenie, čo z webu vyplýva?

- reason: weak source relevance: expected náklady, vykurovanie
- suggested improvement: Retrieval: add stronger synonyms and route vague HVAC queries toward service, subsidy, price and design chunks instead of random page matches.

### RAG011 Aký je rozdiel medzi montážou nového čerpadla a servisom existujúceho?

- reason: weak source relevance: expected montáž, servis
- suggested improvement: Retrieval: add stronger synonyms and route vague HVAC queries toward service, subsidy, price and design chunks instead of random page matches.

### RAG012 Kedy by dávalo zmysel riešiť dotáciu a kedy servis?

- reason: weak source relevance: expected dotácia, servis
- suggested improvement: Retrieval: add stronger synonyms and route vague HVAC queries toward service, subsidy, price and design chunks instead of random page matches.

## Hardest Questions

| ID | Category | Verdict | Confidence | Top score | Reason |
| --- | --- | --- | --- | --- | --- |
| RAG006 | paraphrase | WARN | medium | 20.67 | weak source relevance: expected dotácia, príspevok |
| RAG012 | synthesis | WARN | high | 69.10 | weak source relevance: expected dotácia, servis |
| RAG011 | synthesis | WARN | high | 104.50 | weak source relevance: expected montáž, servis |
| RAG009 | paraphrase | WARN | high | 105.00 | weak source relevance: expected náklady, vykurovanie |
| RAG017 | ambiguous | PASS | low | 0.00 | passed |
| RAG021 | out_of_scope | PASS | low | 0.00 | passed |
| RAG022 | out_of_scope | PASS | low | 0.00 | passed |
| RAG023 | out_of_scope | PASS | low | 0.00 | passed |
| RAG024 | out_of_scope | PASS | low | 0.00 | passed |
| RAG019 | ambiguous | PASS | medium | 15.50 | passed |

## Recommendations

- Retrieval: add stronger synonyms and route vague HVAC queries toward service, subsidy, price and design chunks instead of random page matches.
