# Retrieval Evaluation Report

## Summary

- total test cases: 42
- top1 pass rate: 83%
- top3 pass rate: 88%
- fallback pass rate: 100%
- average top score: 90.21
- verdict: PASS

Confidence thresholds: `finalScore >= 35` is confident, `14-34.99` is uncertain, `< 14` is no answer.

## Category Breakdown

| Category | Cases | Top1 | Top3 | Fallback |
| --- | --- | --- | --- | --- |
| produkty | 10 | 90% | 100% | n/a |
| cena | 5 | 100% | 100% | n/a |
| dotácie | 5 | 80% | 100% | n/a |
| servis | 4 | 100% | 100% | n/a |
| montáž | 4 | 100% | 100% | n/a |
| hlučnosť | 4 | 100% | 100% | n/a |
| kontakt | 4 | 100% | 100% | n/a |
| fallback | 6 | 17% | 17% | 100% |

## Failed Cases

None.

## Weak Areas

- fallback: top3 17%, fallback 100%.

Likely failure causes: missing source content for some brand-specific questions, sparse contact/email chunks, and lexical limits without embeddings.

## Recommendations

- Add explicit brand pages or metadata for brands that are offered but absent from the content.
- Add a small curated contact chunk if the public export has weak phone/email coverage.
- Keep this lexical engine as a deterministic baseline before adding embeddings.
- Re-run evaluation after every knowledge rebuild.
