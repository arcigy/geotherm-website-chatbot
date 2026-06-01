# RAG Massive Evaluation Report

## Summary
- total tests: 200
- pass: 200
- warn: 0
- fail: 0
- pass rate: 100%
- hallucination incidents: 0
- overconfidence incidents: 0
- retrieval drift incidents: 0
- contact aggression violations: 0
- estimated real-world reliability: moderate-high for local demo, not production

## Category Breakdown
| category | total | passRate | warn | fail |
| --- | --- | --- | --- | --- |
| direct_factual | 10 | 100% | 0 | 0 |
| paraphrase | 10 | 100% | 0 | 0 |
| broken_grammar | 10 | 100% | 0 | 0 |
| typos | 10 | 100% | 0 | 0 |
| slovak_slang | 10 | 100% | 0 | 0 |
| mixed_slovak_czech | 10 | 100% | 0 | 0 |
| mixed_slovak_english | 10 | 100% | 0 | 0 |
| very_short_vague | 10 | 100% | 0 | 0 |
| long_chaotic | 10 | 100% | 0 | 0 |
| multi_question | 10 | 100% | 0 | 0 |
| contradictory_prompts | 10 | 100% | 0 | 0 |
| prompt_injection | 10 | 100% | 0 | 0 |
| emotional_frustrated | 10 | 100% | 0 | 0 |
| price_pressure | 10 | 100% | 0 | 0 |
| safety_sensitive | 10 | 100% | 0 | 0 |
| hallucination_bait | 10 | 100% | 0 | 0 |
| competitor_mentions | 10 | 100% | 0 | 0 |
| unsupported_claims | 10 | 100% | 0 | 0 |
| ambiguous_service_product_confusion | 10 | 100% | 0 | 0 |
| retrieval_overlap_confusion | 10 | 100% | 0 | 0 |

## Weakest Categories
| category | total | passRate | warn | fail |
| --- | --- | --- | --- | --- |
| direct_factual | 10 | 100% | 0 | 0 |
| paraphrase | 10 | 100% | 0 | 0 |
| broken_grammar | 10 | 100% | 0 | 0 |
| typos | 10 | 100% | 0 | 0 |
| slovak_slang | 10 | 100% | 0 | 0 |
| mixed_slovak_czech | 10 | 100% | 0 | 0 |
| mixed_slovak_english | 10 | 100% | 0 | 0 |
| very_short_vague | 10 | 100% | 0 | 0 |

## Strongest Categories
| category | total | passRate | warn | fail |
| --- | --- | --- | --- | --- |
| retrieval_overlap_confusion | 10 | 100% | 0 | 0 |
| ambiguous_service_product_confusion | 10 | 100% | 0 | 0 |
| unsupported_claims | 10 | 100% | 0 | 0 |
| competitor_mentions | 10 | 100% | 0 | 0 |
| hallucination_bait | 10 | 100% | 0 | 0 |
| safety_sensitive | 10 | 100% | 0 | 0 |
| price_pressure | 10 | 100% | 0 | 0 |
| emotional_frustrated | 10 | 100% | 0 | 0 |

## Failed Cases
No failed massive cases.

## Warn Cases
No warned massive cases.

## Retrieval Chaos Summary
- tests: 20
- pass/warn/fail: 17/3/0
- top1 relevance: 0.95
- top3 diversity: 1
- false positive rate: 0
- irrelevant source contamination: 0.15
- overconfident wrong retrievals: 0
- drift incidents: 0

## Semantic Coverage Summary
- chunks: 1418
- pages: 334
- weak topics: none
- duplicate clusters: 0
- low-confidence hotspots: 1

## Contradiction Check Summary
- suspected conflicts: 6
- price-like mentions: 44
- time-sensitive mentions: 20

## Long Conversation Summary
- scenarios: 3
- turns: 61
- pass/warn/fail: 53/8/0
- hallucinations: 0
- contact aggression: 0
- source degradation: 0

## Production Risk Assessment
USABLE FOR INTERNAL TESTING ONLY. No critical incidents detected, but warnings need manual review before client deployment.
