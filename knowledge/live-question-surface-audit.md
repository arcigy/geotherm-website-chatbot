# Live Question Surface Audit

Generated: 2026-06-02T05:26:49.067Z
Questions: 102
Passed: 47
Failed: 55
Max response time: 8000 ms

## Failures
| id | ms | llm | mode | service | intent | sources | failures | question |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Q001 | 9557 | yes | direct_answer | unknown | service_fault | 3 | responseTimeMs>8000: 9557 | Robíte havarijné výjazdy? |
| Q003 | 12752 | yes | direct_answer | service | service_fault | 3 | responseTimeMs>8000: 12752 | Aká je cena výjazdu? |
| Q007 | 11879 | yes | rag_answer | unknown | general | 3 | responseTimeMs>8000: 11879 | Aké služby poskytujete? |
| Q010 | 10842 | yes | direct_answer | service | process | 3 | responseTimeMs>8000: 10842 | Robíte pravidelné revízie plynu? |
| Q011 | 11045 | yes | direct_answer | service | process | 3 | responseTimeMs>8000: 11045 | Robíte revízie kotlov? |
| Q013 | 23496 | yes | rag_answer | heat_pump | general | 3 | responseTimeMs>8000: 23496 | Robíte aj radiátory? |
| Q015 | 12223 | yes | ai_fallback | heat_pump | process | 3 | responseTimeMs>8000: 12223 | Robíte aj prerábky kúrenia v starých domoch? |
| Q016 | 8150 | yes | direct_answer | complex_solution | process | 3 | responseTimeMs>8000: 8150 | Robíte aj bytové jadra? |
| Q017 | 19131 | yes | ai_fallback | complex_solution | process | 3 | responseTimeMs>8000: 19131 | Robíte aj kompletné rekonštrukcie kúrenia? |
| Q021 | 16440 | yes | rag_answer | complex_solution | process | 3 | responseTimeMs>8000: 16440 | Robíte aj elektroinštaláciu ku kotlom? |
| Q022 | 19523 | yes | ai_fallback | complex_solution | process | 3 | responseTimeMs>8000: 19523 | Viete zabezpečiť aj projekt? |
| Q026 | 9937 | yes | direct_answer | unknown | process | 3 | responseTimeMs>8000: 9937 | Robíte aj malé zákazky? |
| Q028 | 13863 | yes | direct_answer | complex_solution | process | 3 | responseTimeMs>8000: 13863 | Aké značky kotlov montujete? |
| Q029 | 11980 | yes | service_fault_triage | service | service_fault | 3 | responseTimeMs>8000: 11980 | Aké značky servisujete? |
| Q034 | 13634 | yes | direct_answer | complex_solution | process | 3 | responseTimeMs>8000: 13634 | Ako dlho trvá montáž kotla? |
| Q035 | 12521 | yes | direct_answer | floor_heating | process | 3 | responseTimeMs>8000: 12521 | Ako dlho trvá realizácia podlahového kúrenia? |
| Q036 | 11278 | yes | price_answer | unknown | price | 3 | responseTimeMs>8000: 11278 | Koľko trvá obhliadka? |
| Q039 | 13611 | yes | price_answer | unknown | price | 3 | responseTimeMs>8000: 13611 | Za ako dlho pošlete cenovú ponuku? |
| Q041 | 10465 | yes | price_answer | unknown | price | 3 | responseTimeMs>8000: 10465 | Viete urobiť orientačnú cenu aj bez obhliadky? |
| Q043 | 19706 | yes | price_answer | unknown | price | 3 | responseTimeMs>8000: 19706 | Viete naceniť podľa projektu? |
| Q046 | 14373 | yes | direct_answer | unknown | contact | 3 | responseTimeMs>8000: 14373 | Viete komunikovať emailom? |
| Q047 | 16450 | yes | price_answer | unknown | price | 3 | responseTimeMs>8000: 16450 | Viete poslať cenovú ponuku online? |
| Q052 | 12270 | yes | ai_fallback | complex_solution | recommendation | 3 | responseTimeMs>8000: 12270 | Viete poradiť s výberom riešenia? |
| Q053 | 10032 | yes | direct_answer | heat_pump | process | 3 | responseTimeMs>8000: 10032 | Viete odporučiť vhodný kotol? |
| Q054 | 16819 | yes | qualification_question | heat_pump | recommendation | 3 | responseTimeMs>8000: 16819 | Viete odporučiť vhodné kúrenie do domu? |
| Q055 | 12443 | yes | service_fault_triage | service | inspection | 3 | responseTimeMs>8000: 12443 | Viete skontrolovať existujúci systém? |
| Q056 | 9280 | yes | direct_answer | service | service_fault | 3 | responseTimeMs>8000: 9280 | Viete spraviť servis aj cudzej montáže? |
| Q058 | 12370 | yes | ai_fallback | heat_pump | recommendation | 3 | responseTimeMs>8000: 12370 | Kedy je potrebná výmena kotla? |
| Q060 | 11992 | yes | service_fault_triage | service | service_fault | 3 | responseTimeMs>8000: 11992 | Čo robiť keď nejde kúrenie? |
| Q061 | 18903 | yes | service_fault_triage | service | service_fault | 3 | responseTimeMs>8000: 18903 | Čo robiť keď kotol ukazuje chybu? |
| Q062 | 12768 | yes | service_fault_triage | service | service_fault | 3 | responseTimeMs>8000: 12768 | Čo robiť keď padá tlak? |
| Q063 | 19894 | yes | service_fault_triage | service | service_fault | 3 | responseTimeMs>8000: 19894 | Viete prísť na diagnostiku? |
| Q065 | 18525 | yes | service_fault_triage | service | inspection | 3 | responseTimeMs>8000: 18525 | Viete poslať technika na obhliadku? |
| Q071 | 8516 | yes | price_answer | unknown | price | 3 | responseTimeMs>8000: 8516 | Koľko dopredu treba rezervovať termín? |
| Q073 | 17244 | yes | rag_answer | unknown | general | 3 | responseTimeMs>8000: 17244 | Používate vlastný materiál? |
| Q075 | 10814 | yes | rag_answer | unknown | general | 3 | responseTimeMs>8000: 10814 | Viete robiť aj v starších domoch? |
| Q077 | 18648 | yes | service_fault_triage | service | process | 3 | responseTimeMs>8000: 18648 | Viete robiť bez odstávky vody? |
| Q078 | 16989 | yes | rag_answer | heat_pump | process | 3 | responseTimeMs>8000: 16989 | Viete robiť bez odstávky kúrenia? |
| Q080 | 17034 | yes | service_fault_triage | service | process | 3 | responseTimeMs>8000: 17034 | Zabezpečujete aj odvoz starého zariadenia? |
| Q081 | 18782 | yes | service_fault_triage | service | service_fault | 3 | responseTimeMs>8000: 18782 | Poskytujete pohotovostný servis? |
| Q082 | 12950 | yes | direct_answer | service | contact | 3 | responseTimeMs>8000: 12950 | Máte nonstop linku? |
| Q084 | 12977 | yes | service_fault_triage | service | service_fault | 3 | responseTimeMs>8000: 12977 | Ako prebieha servisný zásah? |
| Q085 | 17096 | yes | rag_answer | unknown | process | 3 | responseTimeMs>8000: 17096 | Čo si má zákazník pripraviť pred montážou? |
| Q086 | 14572 | yes | direct_answer | complex_solution | process | 3 | responseTimeMs>8000: 14572 | Potrebujem pred realizáciou niečo vybaviť? |
| Q088 | 26400 | yes | service_fault_triage | service | process | 3 | responseTimeMs>8000: 26400 | Viete zabezpečiť aj spustenie zariadenia? |
| Q089 | 11918 | yes | service_fault_triage | service | service_fault | 3 | responseTimeMs>8000: 11918 | Viete zabezpečiť záručný servis? |
| Q091 | 11930 | yes | service_fault_triage | service | inspection | 3 | responseTimeMs>8000: 11930 | Viete prísť pozrieť problém osobne? |
| Q093 | 16195 | yes | service_fault_triage | service | inspection | 3 | responseTimeMs>8000: 16195 | Viete spraviť obhliadku cez videohovor? |
| Q094 | 12221 | yes | ai_fallback | unknown | process | 3 | responseTimeMs>8000: 12221 | Aký je postup pri objednávke služby? |
| Q095 | 11714 | yes | service_fault_triage | service | process | 3 | responseTimeMs>8000: 11714 | Ako si môžem rezervovať termín? |
| Q096 | 12971 | yes | ai_fallback | unknown | process | 3 | responseTimeMs>8000: 12971 | Ako rýchlo odpovedáte na dopyty? |
| Q097 | 13585 | yes | direct_answer | unknown | contact | 3 | responseTimeMs>8000: 13585 | Kto bude môj kontakt počas realizácie? |
| Q098 | 13681 | yes | direct_answer | unknown | process | 3 | responseTimeMs>8000: 13681 | Dostanem po realizácii dokumentáciu? |
| Q100 | 8238 | yes | direct_answer | service | service_fault | 3 | responseTimeMs>8000: 8238 | Robíte aj pozáručný servis? |
| Q101 | 12314 | yes | service_fault_triage | service | service_fault | 3 | responseTimeMs>8000: 12314 | Viete nastaviť termín pravidelného servisu? |

## All Questions
| id | pass | ms | llm | mode | service | intent | sources | question |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Q001 | no | 9557 | yes | direct_answer | unknown | service_fault | 3 | Robíte havarijné výjazdy? |
| Q002 | yes | 2846 | yes | direct_answer | unknown | location | 3 | Do akých miest a okresov chodíte? |
| Q003 | no | 12752 | yes | direct_answer | service | service_fault | 3 | Aká je cena výjazdu? |
| Q004 | yes | 3851 | yes | direct_answer | service | service_fault | 3 | Aká je čakacia doba na servis? |
| Q005 | yes | 2869 | yes | direct_answer | service | contact | 3 | Viete prísť ešte dnes? |
| Q006 | yes | 3175 | yes | direct_answer | service | contact | 3 | Robíte aj cez víkendy? |
| Q007 | no | 11879 | yes | rag_answer | unknown | general | 3 | Aké služby poskytujete? |
| Q008 | yes | 2778 | yes | direct_answer | complex_solution | process | 3 | Robíte aj montáž nových kotlov? |
| Q009 | yes | 3338 | yes | direct_answer | service | service_fault | 3 | Robíte aj servis existujúcich kotlov? |
| Q010 | no | 10842 | yes | direct_answer | service | process | 3 | Robíte pravidelné revízie plynu? |
| Q011 | no | 11045 | yes | direct_answer | service | process | 3 | Robíte revízie kotlov? |
| Q012 | yes | 6639 | yes | rag_answer | floor_heating | general | 3 | Robíte aj podlahové kúrenie? |
| Q013 | no | 23496 | yes | rag_answer | heat_pump | general | 3 | Robíte aj radiátory? |
| Q014 | yes | 2803 | yes | direct_answer | complex_solution | process | 3 | Robíte aj rozvody vody? |
| Q015 | no | 12223 | yes | ai_fallback | heat_pump | process | 3 | Robíte aj prerábky kúrenia v starých domoch? |
| Q016 | no | 8150 | yes | direct_answer | complex_solution | process | 3 | Robíte aj bytové jadra? |
| Q017 | no | 19131 | yes | ai_fallback | complex_solution | process | 3 | Robíte aj kompletné rekonštrukcie kúrenia? |
| Q018 | yes | 5045 | yes | rag_answer | heat_pump | general | 3 | Robíte aj tepelné čerpadlá? |
| Q019 | yes | 6842 | yes | rag_answer | air_conditioning | general | 3 | Robíte aj klimatizácie? |
| Q020 | yes | 6210 | yes | direct_answer | service | process | 3 | Robíte aj kominárske práce? |
| Q021 | no | 16440 | yes | rag_answer | complex_solution | process | 3 | Robíte aj elektroinštaláciu ku kotlom? |
| Q022 | no | 19523 | yes | ai_fallback | complex_solution | process | 3 | Viete zabezpečiť aj projekt? |
| Q023 | yes | 5189 | yes | rag_answer | subsidy | subsidy | 3 | Viete zabezpečiť aj dotácie? |
| Q024 | yes | 3405 | yes | direct_answer | unknown | process | 3 | Robíte aj pre firmy? |
| Q025 | yes | 3143 | yes | direct_answer | complex_solution | process | 3 | Robíte aj bytové domy? |
| Q026 | no | 9937 | yes | direct_answer | unknown | process | 3 | Robíte aj malé zákazky? |
| Q027 | yes | 6581 | yes | direct_answer | service | process | 3 | Montujete aj kotly zakúpené zákazníkom? |
| Q028 | no | 13863 | yes | direct_answer | complex_solution | process | 3 | Aké značky kotlov montujete? |
| Q029 | no | 11980 | yes | service_fault_triage | service | service_fault | 3 | Aké značky servisujete? |
| Q030 | yes | 2478 | yes | direct_answer | heat_pump | process | 3 | Máte certifikáciu na plynové zariadenia? |
| Q031 | yes | 3096 | yes | direct_answer | unknown | process | 3 | Máte poistenie zodpovednosti? |
| Q032 | yes | 4058 | yes | direct_answer | service | process | 3 | Poskytujete záruku na prácu? |
| Q033 | yes | 6170 | yes | direct_answer | service | process | 3 | Poskytujete servis po montáži? |
| Q034 | no | 13634 | yes | direct_answer | complex_solution | process | 3 | Ako dlho trvá montáž kotla? |
| Q035 | no | 12521 | yes | direct_answer | floor_heating | process | 3 | Ako dlho trvá realizácia podlahového kúrenia? |
| Q036 | no | 11278 | yes | price_answer | unknown | price | 3 | Koľko trvá obhliadka? |
| Q037 | yes | 2866 | yes | direct_answer | service | inspection | 3 | Je obhliadka platená? |
| Q038 | yes | 3614 | yes | direct_answer | unknown | quote | 3 | Robíte cenové ponuky zdarma? |
| Q039 | no | 13611 | yes | price_answer | unknown | price | 3 | Za ako dlho pošlete cenovú ponuku? |
| Q040 | yes | 5303 | yes | price_answer | unknown | price | 3 | Čo všetko obsahuje cenová ponuka? |
| Q041 | no | 10465 | yes | price_answer | unknown | price | 3 | Viete urobiť orientačnú cenu aj bez obhliadky? |
| Q042 | yes | 3749 | yes | direct_answer | unknown | process | 3 | Aké informácie potrebujete na cenovú ponuku? |
| Q043 | no | 19706 | yes | price_answer | unknown | price | 3 | Viete naceniť podľa projektu? |
| Q044 | yes | 3550 | yes | direct_answer | unknown | quote | 3 | Viete naceniť podľa fotiek? |
| Q045 | yes | 6342 | yes | direct_answer | unknown | contact | 3 | Viete komunikovať cez WhatsApp? |
| Q046 | no | 14373 | yes | direct_answer | unknown | contact | 3 | Viete komunikovať emailom? |
| Q047 | no | 16450 | yes | price_answer | unknown | price | 3 | Viete poslať cenovú ponuku online? |
| Q048 | yes | 3740 | yes | direct_answer | unknown | price | 3 | Aké sú možnosti platby? |
| Q049 | yes | 3656 | yes | direct_answer | unknown | price | 3 | Beriete zálohy? |
| Q050 | yes | 2865 | yes | direct_answer | unknown | price | 3 | Dá sa platiť na faktúru? |
| Q051 | yes | 5049 | yes | direct_answer | unknown | price | 3 | Poskytujete splátky? |
| Q052 | no | 12270 | yes | ai_fallback | complex_solution | recommendation | 3 | Viete poradiť s výberom riešenia? |
| Q053 | no | 10032 | yes | direct_answer | heat_pump | process | 3 | Viete odporučiť vhodný kotol? |
| Q054 | no | 16819 | yes | qualification_question | heat_pump | recommendation | 3 | Viete odporučiť vhodné kúrenie do domu? |
| Q055 | no | 12443 | yes | service_fault_triage | service | inspection | 3 | Viete skontrolovať existujúci systém? |
| Q056 | no | 9280 | yes | direct_answer | service | service_fault | 3 | Viete spraviť servis aj cudzej montáže? |
| Q057 | yes | 3305 | yes | direct_answer | service | service_fault | 3 | Viete opraviť starší kotol? |
| Q058 | no | 12370 | yes | ai_fallback | heat_pump | recommendation | 3 | Kedy je potrebná výmena kotla? |
| Q059 | yes | 5330 | yes | rag_answer | heat_pump | general | 3 | Čo robiť pri úniku plynu? |
| Q060 | no | 11992 | yes | service_fault_triage | service | service_fault | 3 | Čo robiť keď nejde kúrenie? |
| Q061 | no | 18903 | yes | service_fault_triage | service | service_fault | 3 | Čo robiť keď kotol ukazuje chybu? |
| Q062 | no | 12768 | yes | service_fault_triage | service | service_fault | 3 | Čo robiť keď padá tlak? |
| Q063 | no | 19894 | yes | service_fault_triage | service | service_fault | 3 | Viete prísť na diagnostiku? |
| Q064 | yes | 3936 | yes | price_answer | service | price | 3 | Koľko stojí diagnostika? |
| Q065 | no | 18525 | yes | service_fault_triage | service | inspection | 3 | Viete poslať technika na obhliadku? |
| Q066 | yes | 1946 | yes | direct_answer | unknown | general | 3 | Koľko rokov ste na trhu? |
| Q067 | yes | 6267 | yes | direct_answer | unknown | process | 3 | Máte referencie? |
| Q068 | yes | 2599 | yes | direct_answer | unknown | process | 3 | Máte ukážky realizácií? |
| Q069 | yes | 7061 | yes | direct_answer | unknown | process | 3 | Máte fotky realizácií? |
| Q070 | yes | 2624 | yes | direct_answer | unknown | process | 3 | Máte recenzie od zákazníkov? |
| Q071 | no | 8516 | yes | price_answer | unknown | price | 3 | Koľko dopredu treba rezervovať termín? |
| Q072 | yes | 5931 | yes | rag_answer | unknown | process | 3 | Viete zabezpečiť aj materiál? |
| Q073 | no | 17244 | yes | rag_answer | unknown | general | 3 | Používate vlastný materiál? |
| Q074 | yes | 5774 | yes | rag_answer | complex_solution | process | 3 | Viete robiť aj v novostavbách? |
| Q075 | no | 10814 | yes | rag_answer | unknown | general | 3 | Viete robiť aj v starších domoch? |
| Q076 | yes | 3444 | yes | direct_answer | heat_pump | process | 3 | Viete robiť počas zimy? |
| Q077 | no | 18648 | yes | service_fault_triage | service | process | 3 | Viete robiť bez odstávky vody? |
| Q078 | no | 16989 | yes | rag_answer | heat_pump | process | 3 | Viete robiť bez odstávky kúrenia? |
| Q079 | yes | 7336 | yes | direct_answer | service | process | 3 | Viete odstrániť starý kotol? |
| Q080 | no | 17034 | yes | service_fault_triage | service | process | 3 | Zabezpečujete aj odvoz starého zariadenia? |
| Q081 | no | 18782 | yes | service_fault_triage | service | service_fault | 3 | Poskytujete pohotovostný servis? |
| Q082 | no | 12950 | yes | direct_answer | service | contact | 3 | Máte nonstop linku? |
| Q083 | yes | 4386 | yes | direct_answer | complex_solution | process | 3 | Ako prebieha realizácia od začiatku do konca? |
| Q084 | no | 12977 | yes | service_fault_triage | service | service_fault | 3 | Ako prebieha servisný zásah? |
| Q085 | no | 17096 | yes | rag_answer | unknown | process | 3 | Čo si má zákazník pripraviť pred montážou? |
| Q086 | no | 14572 | yes | direct_answer | complex_solution | process | 3 | Potrebujem pred realizáciou niečo vybaviť? |
| Q087 | yes | 2663 | yes | direct_answer | service | process | 3 | Potrebujem revíziu po montáži? |
| Q088 | no | 26400 | yes | service_fault_triage | service | process | 3 | Viete zabezpečiť aj spustenie zariadenia? |
| Q089 | no | 11918 | yes | service_fault_triage | service | service_fault | 3 | Viete zabezpečiť záručný servis? |
| Q090 | yes | 2794 | yes | direct_answer | unknown | process | 3 | Aké sú najčastejšie termíny realizácie? |
| Q091 | no | 11930 | yes | service_fault_triage | service | inspection | 3 | Viete prísť pozrieť problém osobne? |
| Q092 | yes | 6978 | yes | direct_answer | unknown | contact | 3 | Viete poradiť telefonicky? |
| Q093 | no | 16195 | yes | service_fault_triage | service | inspection | 3 | Viete spraviť obhliadku cez videohovor? |
| Q094 | no | 12221 | yes | ai_fallback | unknown | process | 3 | Aký je postup pri objednávke služby? |
| Q095 | no | 11714 | yes | service_fault_triage | service | process | 3 | Ako si môžem rezervovať termín? |
| Q096 | no | 12971 | yes | ai_fallback | unknown | process | 3 | Ako rýchlo odpovedáte na dopyty? |
| Q097 | no | 13585 | yes | direct_answer | unknown | contact | 3 | Kto bude môj kontakt počas realizácie? |
| Q098 | no | 13681 | yes | direct_answer | unknown | process | 3 | Dostanem po realizácii dokumentáciu? |
| Q099 | yes | 2761 | yes | direct_answer | service | service_fault | 3 | Robíte aj servis počas záruky? |
| Q100 | no | 8238 | yes | direct_answer | service | service_fault | 3 | Robíte aj pozáručný servis? |
| Q101 | no | 12314 | yes | service_fault_triage | service | service_fault | 3 | Viete nastaviť termín pravidelného servisu? |
| Q102 | yes | 3065 | yes | direct_answer | service | service_fault | 3 | Viete pripomínať pravidelné revízie? |

## Failed Answer Samples
### Q001 Robíte havarijné výjazdy?

Failures: responseTimeMs>8000: 9557

### Servisný smer

Rozumiem, zariadenie hlási chybu. Pri poruche by som neradil žiadny svojpomocný zásah do zariadenia; najprv treba zistiť presný model, chybový kód a lokalitu, aby sa dalo posúdiť, či ide o servisný zásah a aký postup je bezpečný.

Pri zariadeniach montovaných inou firmou treba dostupnosť servisu potvrdiť podľa značky a prípadu.

Pošli mi prosím model alebo fotku štítku, chybový kód z displeja a mesto, kde je zariadenie.

Ide o existujúce zariadenie s poruchou, pravidelný servis, alebo zvažuješ výmenu za nové riešenie?

Jasné, ďalší krok je, aby sa vám vedel ozvať technik alebo obchodník a dohodol postup. Pošlite prosím telefón alebo e-mail, prípadne aj meno. Kontakt použijeme iba na spätné ozvanie k tomuto dopytu.

### Q003 Aká je cena výjazdu?

Failures: responseTimeMs>8000: 12752

### Servisný smer

Rozumiem, zariadenie hlási chybu. Pri poruche by som neradil žiadny svojpomocný zásah do zariadenia; najprv treba zistiť presný model, chybový kód a lokalitu, aby sa dalo posúdiť, či ide o servisný zásah a aký postup je bezpečný.

Pri zariadeniach montovaných inou firmou treba dostupnosť servisu potvrdiť podľa značky a prípadu.

Pošli mi prosím model alebo fotku štítku, chybový kód z displeja a mesto, kde je zariadenie.

Ide o existujúce zariadenie s poruchou, pravidelný servis, alebo zvažuješ výmenu za nové riešenie?

Jasné, ďalší krok je, aby sa vám vedel ozvať technik alebo obchodník a dohodol postup. Pošlite prosím telefón alebo e-mail, prípadne aj meno. Kontakt použijeme iba na spätné ozvanie k tomuto dopytu.

### Q007 Aké služby poskytujete?

Failures: responseTimeMs>8000: 11879

### Naše služby

Ahoj, v Geotherme sa zameriavame na komplexné technické riešenia pre tvoj dom. Poskytujeme:

* **Tepelné čerpadlá**
* **Klimatizácie**
* **Rekuperáciu**
* **Podlahové kúrenie a stropné chladenie**
* **Servis zariadení**
* **Asistenciu s dotáciami**
* **Komplexné technické riešenia domu**

Aby som ti vedel čo najlepšie poradiť, povedz mi, prosím, čo konkrétne ťa zaujíma. Riešiš kúrenie, chladenie, vetranie, servis, dotáciu, alebo hľadáš celkové riešenie pre novostavbu či rekonštrukciu?

### Q010 Robíte pravidelné revízie plynu?

Failures: responseTimeMs>8000: 10842

### Revízie plynu

Pri **revíziách plynu** treba aktuálny rozsah potvrdiť podľa typu práce a lokality. Interné FAQ potvrdzuje certifikáciu na plynové zariadenia, ale konkrétnu pravidelnú revíziu plynu by som potvrdil pri dopyte spolu s tým, či ide o kotol, rozvod alebo inú časť plynovej inštalácie.

Ide o existujúce zariadenie s poruchou, pravidelný servis, alebo zvažuješ výmenu za nové riešenie?

### Q011 Robíte revízie kotlov?

Failures: responseTimeMs>8000: 11045

### Revízie kotlov

Pri **revíziách kotlov** treba potvrdiť značku, typ kotla, požadovaný doklad a lokalitu. Geotherm vie riešiť kotly a plynové zariadenia, ale presný rozsah revízie kotla netreba sľubovať bez potvrdenia konkrétnej situácie.

Ide o existujúce zariadenie s poruchou, pravidelný servis, alebo zvažuješ výmenu za nové riešenie?

### Q013 Robíte aj radiátory?

Failures: responseTimeMs>8000: 23496

### Tepelné čerpadlá a radiátory

Áno, riešime aj inštaláciu tepelných čerpadiel k existujúcim radiátorovým systémom. Je to bežné riešenie, najmä pri starších domoch.

**Dôležité je overiť:**

* **Výkon radiátorov:** Zvládnu vaše radiátory vykurovať dom pri nižšej teplote vody, ktorú dodáva tepelné čerpadlo?
* **Potrebná teplota vody:** Ak vaše radiátory vyžadujú vyššiu teplotu vody, možno bude potrebné ich doplniť alebo vymeniť.

Aby som ti vedel lepšie poradiť, povedz mi, prosím, akým spôsobom sa momentálne kúriš a akú máš približnú vykurovanú plochu domu.

### Q015 Robíte aj prerábky kúrenia v starých domoch?

Failures: responseTimeMs>8000: 12223

### Predbežný smer

Podľa toho, čo píšeš, by som najprv určil vhodnú službu a technický scenár, potom až konkrétnu značku, cenu alebo termín. Ak chýba presný firemný fakt, dá sa stále povedať všeobecný technický smer, ale firemné podmienky treba potvrdiť.

Riešiš kúrenie, chladenie, vetranie, servis alebo dotáciu?

### Q016 Robíte aj bytové jadra?

Failures: responseTimeMs>8000: 8150

### Bytové jadrá

Pri **bytových jadrách** nemám bezpečný podklad, že ich Geotherm berie ako samostatnú štandardnú službu. Treba potvrdiť rozsah: či ide len o rozvody vody, kanalizáciu, kúrenie alebo komplexnú rekonštrukciu. Ak ide o technické rozvody, pošli fotky/pôdorys a dá sa preveriť nacenenie.

### Q017 Robíte aj kompletné rekonštrukcie kúrenia?

Failures: responseTimeMs>8000: 19131

### Predbežný smer

Podľa toho, čo píšeš, by som najprv určil vhodnú službu a technický scenár, potom až konkrétnu značku, cenu alebo termín. Ak chýba presný firemný fakt, dá sa stále povedať všeobecný technický smer, ale firemné podmienky treba potvrdiť.

Riešiš kúrenie, chladenie, vetranie, servis alebo dotáciu?

### Q021 Robíte aj elektroinštaláciu ku kotlom?

Failures: responseTimeMs>8000: 16440

### Elektroinštalácia ku kotlom

Ahoj, ako Geotherm sa primárne zameriavame na komplexné technické riešenia domov, ktoré zahŕňajú tepelné čerpadlá, klimatizácie, rekuperáciu, podlahové kúrenie a stropné chladenie. Elektroinštaláciu ako takú, ktorá by bola súčasťou bežnej elektroinštalácie domu, nerobíme.

Naše služby sa sústreďujú na integráciu týchto systémov a zabezpečenie ich optimálnej funkčnosti. Ak riešiš kúrenie, chladenie, vetranie alebo teplú vodu v tvojom dome a potrebuješ koordinovať tieto technológie, radi ti s tým pomôžeme.

Aby som ti mohol lepšie poradiť, povedz mi, či ide o novostavbu alebo rekonštrukciu a aké konkrétne technológie by si chcel v dome riešiť (napr. kúrenie, chladenie, ohrev vody, vetranie).

### Q022 Viete zabezpečiť aj projekt?

Failures: responseTimeMs>8000: 19523

### Predbežný smer

Podľa toho, čo píšeš, by som najprv určil vhodnú službu a technický scenár, potom až konkrétnu značku, cenu alebo termín. Ak chýba presný firemný fakt, dá sa stále povedať všeobecný technický smer, ale firemné podmienky treba potvrdiť.

Riešiš kúrenie, chladenie, vetranie, servis alebo dotáciu?

### Q026 Robíte aj malé zákazky?

Failures: responseTimeMs>8000: 9937

### Menšie zákazky

Menšie zákazky treba potvrdiť podľa typu práce, lokality a aktuálnej kapacity. Ak ide o servis, rozvody alebo úpravu kotolne, pošli stručný popis a fotky; podľa toho sa dá povedať, či to Geotherm vie zaradiť.

### Q028 Aké značky kotlov montujete?

Failures: responseTimeMs>8000: 13863

### Značky kotlov

Pri **značkách kotlov** treba aktuálnu montážnu ponuku potvrdiť podľa konkrétneho dopytu. Bezpečne môžem povedať, že Geotherm rieši kotly a výmenu plynového kotla; konkrétnu značku kotla by som potvrdil podľa dostupnosti, typu kotolne a požadovaného riešenia.

Ide o existujúce zariadenie s poruchou, pravidelný servis, alebo zvažuješ výmenu za nové riešenie?

### Q029 Aké značky servisujete?

Failures: responseTimeMs>8000: 11980

### Servisný smer

Pri poruche je najdôležitejšie najprv identifikovať zariadenie a chybu, nie radiť zásahy do jednotky. Všeobecne treba preveriť značku, model, chybový kód a lokalitu; pri cudzej montáži sa dostupnosť servisu musí potvrdiť podľa značky a prípadu.

Pošli mi prosím značku/model alebo fotku štítku a chybový kód z displeja.

Ide o existujúce zariadenie s poruchou, pravidelný servis, alebo zvažuješ výmenu za nové riešenie?

### Q034 Ako dlho trvá montáž kotla?

Failures: responseTimeMs>8000: 13634

### Trvanie montáže

Trvanie montáže sa nedá garantovať bez rozsahu, ale pri tepelnom čerpadle treba rátať s prípravou, hydraulickým zapojením, elektroprípravou, reguláciou a spustením. Jednoduchá výmena je iná ako starší dom s úpravou kotolne alebo radiátorov; preto je najlepší ďalší krok nacenenie podľa domu. Ide o nové tepelné čerpadlo, výmenu kotla alebo inú montáž?

### Q035 Ako dlho trvá realizácia podlahového kúrenia?

Failures: responseTimeMs>8000: 12521

### Trvanie montáže

Trvanie montáže sa nedá garantovať bez rozsahu, ale pri tepelnom čerpadle treba rátať s prípravou, hydraulickým zapojením, elektroprípravou, reguláciou a spustením. Jednoduchá výmena je iná ako starší dom s úpravou kotolne alebo radiátorov; preto je najlepší ďalší krok nacenenie podľa domu. Ide o nové tepelné čerpadlo, výmenu kotla alebo inú montáž?

### Q036 Koľko trvá obhliadka?

Failures: responseTimeMs>8000: 11278

### Cena vrátane inštalácie

konkrétnu cenu bez konkrétnej ponuky nepotvrdím. Pri tepelnom čerpadle treba rozlíšiť cenu samotnej zostavy a cenu kompletnej realizácie.

Pri tepelnom čerpadle cenu ovplyvňuje výkon, radiátory alebo podlahovka, TÚV zásobník, regulácia, montážny materiál, úpravy kotolne, elektropráce, uvedenie do prevádzky a prípadná akumulačná nádrž.

Ak máš v ruke cenu, najdôležitejšie je porovnať rozsah: čo je zahrnuté, čo je príplatok a čo sa bude riešiť až po obhliadke alebo návrhu.

Ide o nové tepelné čerpadlo pre dom, výmenu starého zdroja alebo servis existujúceho zariadenia?

Jasné, ďalší krok je, aby sa vám vedel ozvať technik alebo obchodník a dohodol postup. Pošlite prosím telefón alebo e-mail, prípadne aj meno. Kontakt použijeme iba na spätné ozvanie k tomuto dopytu.

### Q039 Za ako dlho pošlete cenovú ponuku?

Failures: responseTimeMs>8000: 13611

Rozumiem, že vás zaujíma, ako dlho trvá, kým dostanete cenovú ponuku. Presný časový rámec na vypracovanie ponuky sa môže líšiť v závislosti od zložitosti projektu a aktuálnej vyťaženosti.

Aby sme vám mohli pripraviť čo najpresnejšiu ponuku, potrebujeme najprv zistiť viac detailov o vašich potrebách.

Ide o nové tepelné čerpadlo pre dom, výmenu starého zdroja alebo máte záujem o servis existujúceho zariadenia?

Jasné, ďalší krok je, aby sa vám vedel ozvať technik alebo obchodník a dohodol postup. Pošlite prosím telefón alebo e-mail, prípadne aj meno. Kontakt použijeme iba na spätné ozvanie k tomuto dopytu.

### Q041 Viete urobiť orientačnú cenu aj bez obhliadky?

Failures: responseTimeMs>8000: 10465

### Cena vrátane inštalácie

konkrétnu cenu bez konkrétnej ponuky nepotvrdím. Pri tepelnom čerpadle treba rozlíšiť cenu samotnej zostavy a cenu kompletnej realizácie.

Pri tepelnom čerpadle cenu ovplyvňuje výkon, radiátory alebo podlahovka, TÚV zásobník, regulácia, montážny materiál, úpravy kotolne, elektropráce, uvedenie do prevádzky a prípadná akumulačná nádrž.

Ak máš v ruke cenu, najdôležitejšie je porovnať rozsah: čo je zahrnuté, čo je príplatok a čo sa bude riešiť až po obhliadke alebo návrhu.

Ide o nové tepelné čerpadlo pre dom, výmenu starého zdroja alebo servis existujúceho zariadenia?

Jasné, ďalší krok je, aby sa vám vedel ozvať technik alebo obchodník a dohodol postup. Pošlite prosím telefón alebo e-mail, prípadne aj meno. Kontakt použijeme iba na spätné ozvanie k tomuto dopytu.

### Q043 Viete naceniť podľa projektu?

Failures: responseTimeMs>8000: 19706

### Cena vrátane inštalácie

konkrétnu cenu bez konkrétnej ponuky nepotvrdím. Pri tepelnom čerpadle treba rozlíšiť cenu samotnej zostavy a cenu kompletnej realizácie.

Pri tepelnom čerpadle cenu ovplyvňuje výkon, radiátory alebo podlahovka, TÚV zásobník, regulácia, montážny materiál, úpravy kotolne, elektropráce, uvedenie do prevádzky a prípadná akumulačná nádrž.

Ak máš v ruke cenu, najdôležitejšie je porovnať rozsah: čo je zahrnuté, čo je príplatok a čo sa bude riešiť až po obhliadke alebo návrhu.

Ide o nové tepelné čerpadlo pre dom, výmenu starého zdroja alebo servis existujúceho zariadenia?

Jasné, ďalší krok je, aby sa vám vedel ozvať technik alebo obchodník a dohodol postup. Pošlite prosím telefón alebo e-mail, prípadne aj meno. Kontakt použijeme iba na spätné ozvanie k tomuto dopytu.

