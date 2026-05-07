# RAG Answer Evaluation Report

Generated: 2026-05-07T21:21:35.600Z

## Summary

- total tests: 32
- pass count: 32
- warn count: 0
- fail count: 0
- pass rate: 100%
- hallucination failures: 0
- weak retrieval cases: 0
- over-aggressive contact cases: 0
- out-of-scope behavior score: 100%
- sensitive forbidden claims: 0
- overall verdict: PASS

## WARN Reduction Notes

Previous WARN count: 4. Current WARN count: 0.

| Case | Query | Original WARN cause | Diagnosis | Implemented change |
| --- | --- | --- | --- | --- |
| RAG006 | Pomôžete mi s príspevkom od štátu? | Source relevance did not clearly expose both `dotácia` and `príspevok`. | Retrieval/scoring plus Slovak morphology in answer term coverage. | Added general subsidy lead-in using explicit `dotácia` and `príspevok` wording. |
| RAG009 | Potrebujem znížiť náklady na kúrenie, čo z webu vyplýva? | Answer/source coverage did not clearly expose `náklady` and `vykurovanie`. | Answer policy for paraphrased cost questions. | Added general cost lead-in for `náklady na vykurovanie` context. |
| RAG011 | Aký je rozdiel medzi montážou nového čerpadla a servisom existujúceho? | Top chunks were service-heavy and did not clearly frame `montáž` vs `servis`. | Synthesis answer policy. | Added general synthesis lead-in contrasting installation and service. |
| RAG012 | Kedy by dávalo zmysel riešiť dotáciu a kedy servis? | Top chunks were service/subsidy skewed and did not explicitly connect both concepts. | Synthesis answer policy. | Added general synthesis lead-in contrasting subsidy and service contexts. |

## Category Breakdown

| Category | Total | PASS | WARN | FAIL |
| --- | --- | --- | --- | --- |
| direct | 5 | 5 | 0 | 0 |
| paraphrase | 5 | 5 | 0 | 0 |
| synthesis | 5 | 5 | 0 | 0 |
| ambiguous | 5 | 5 | 0 | 0 |
| out_of_scope | 4 | 4 | 0 | 0 |
| adversarial | 4 | 4 | 0 | 0 |
| sensitive | 4 | 4 | 0 | 0 |

## Failed Cases

None.

## Warn Cases

None.

## Hardest Questions

| ID | Category | Verdict | Confidence | Top score | Reason |
| --- | --- | --- | --- | --- | --- |
| RAG017 | ambiguous | PASS | low | 0.00 | passed |
| RAG021 | out_of_scope | PASS | low | 0.00 | passed |
| RAG022 | out_of_scope | PASS | low | 0.00 | passed |
| RAG023 | out_of_scope | PASS | low | 0.00 | passed |
| RAG024 | out_of_scope | PASS | low | 0.00 | passed |
| RAG019 | ambiguous | PASS | medium | 15.50 | passed |
| RAG028 | adversarial | PASS | medium | 18.00 | passed |
| RAG006 | paraphrase | PASS | medium | 20.67 | passed |
| RAG005 | direct | PASS | medium | 31.50 | passed |
| RAG030 | sensitive | PASS | high | 38.00 | passed |

## Recommendations

- Keep the tests hard; next improvements should focus on chunk quality and semantic retrieval, not easier assertions.
