# Sales Feedback Audit

Generated: 2026-06-03T19:46:20.648Z
Turns: 18
Passed: 18
Failed: 0
Max response time: 8000 ms
Verdict: PASS

## Turns

| Scenario | Turn | Pass | ms | LLM | Mode | Service | Intent | Sources | Message | Failures |
| --- | ---: | --- | ---: | --- | --- | --- | --- | ---: | --- | --- |
| neutral_microphone_test | 1 | yes | 2368 | yes | direct_answer | unknown | general | 0 | Ahoj raz dva tri |  |
| neutral_microphone_test | 2 | yes | 2012 | yes | direct_answer | unknown | general | 0 | sds |  |
| large_house_no_price_or_model_guess | 1 | yes | 3439 | yes | price_answer | heat_pump | price | 3 | Este raz prosim orientacnu cenu TC s montazou - preferujem vzduch voda ale dajte aj zemne |  |
| large_house_no_price_or_model_guess | 2 | yes | 3206 | yes | price_answer | heat_pump | contact | 3 | mam 580m2 dom - zda sa mi to lacne |  |
| large_house_no_price_or_model_guess | 3 | yes | 3002 | yes | brand_model_answer | heat_pump | contact | 3 | ano ktore modely by boli vhodne? |  |
| large_house_no_price_or_model_guess | 4 | yes | 2733 | yes | price_answer | heat_pump | contact | 3 | chcem vediet cenu s montazou |  |
| appointment_time_not_confirmed | 1 | yes | 2160 | yes | handoff_cta | complex_solution | quote | 3 | chcem cenovu ponuku a obhliadku |  |
| appointment_time_not_confirmed | 2 | yes | 2656 | yes | direct_answer | complex_solution | contact | 3 | dnes medzi 15-16:00 |  |
| appointment_time_not_confirmed | 3 | yes | 2464 | yes | direct_answer | complex_solution | contact | 3 | Ruzindolska 16 trnava, ale 8:00 uz bolo |  |
| appointment_time_not_confirmed | 4 | yes | 2339 | yes | direct_answer | complex_solution | contact | 3 | 10:00 |  |
| large_object_quote_yes_then_time | 1 | yes | 2978 | yes | price_answer | heat_pump | contact | 3 | mam 580m2 dom a chcem cenu tepelneho cerpadla s montazou |  |
| large_object_quote_yes_then_time | 2 | yes | 2396 | yes | handoff_cta | heat_pump | contact | 3 | ano |  |
| large_object_quote_yes_then_time | 3 | yes | 2576 | yes | direct_answer | heat_pump | contact | 3 | dnes medzi 15-16:00 |  |
| past_or_impossible_appointment_not_confirmed | 1 | yes | 2742 | yes | handoff_cta | unknown | quote | 3 | chcem cenovu ponuku a obhliadku |  |
| past_or_impossible_appointment_not_confirmed | 2 | yes | 2115 | yes | direct_answer | unknown | contact | 3 | pockaj a mozeme sa stretnut dnes o 8:00 rano? |  |
| past_or_impossible_appointment_not_confirmed | 3 | yes | 2770 | yes | direct_answer | unknown | contact | 3 | a co vcera mozeme aj vcera? |  |
| past_or_impossible_appointment_not_confirmed | 4 | yes | 2792 | yes | direct_answer | unknown | contact | 3 | Ruzindolska 16 trnava, ale 8:00 uz bolo |  |
| past_or_impossible_appointment_not_confirmed | 5 | yes | 2347 | yes | direct_answer | service | contact | 3 | 10:00 |  |

## Failed Answer Samples

