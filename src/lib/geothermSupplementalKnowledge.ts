export type SupplementalKnowledgePage = {
  url: string;
  slug: string;
  title: string;
  description: string;
  headings: string[];
  tags: string[];
  text: string;
  chunks: Array<{
    id: string;
    content: string;
  }>;
  images: Array<{
    url: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
};

const serviceFaqText = [
  "GEOTHERM robí havarijné výjazdy u svojich zákazníkov.",
  "Pracujú v mestách na západnom a strednom Slovensku a v pohraničí Rakúska.",
  "Práce je ideálne naplánovať aspoň 24 hodín vopred. V ojedinelých prípadoch vedia prísť aj dnes.",
  "Cez víkendy zväčša nerobia.",
  "Služby zahŕňajú rozvody kúrenia a chladenia, podlahové kúrenie a chladenie, stropné kúrenie a chladenie, vrty pre tepelné čerpadlá, rekuperácie a všetky typy tepelných čerpadiel.",
  "Vedia vymeniť aj plynový kotol.",
  "Bytové jadrá nerobia.",
  "Kominárske práce nerobia.",
  "Elektroinštaláciu ku kotlom robia občas, no zákazníci si ju zväčša zabezpečujú vlastnými elektrikármi.",
  "Robia aj pre firmy.",
  "Robia aj malé zákazky.",
  "Majú certifikáciu na plynové zariadenia.",
  "Majú poistenie zodpovednosti.",
  "Montáž kotla závisí od zložitosti kotolne. Pri jednoduchej výmene kotla môže trvať od jedného dňa.",
  "Orientačná ponuka sa dá pripraviť aj podľa dobrých a kvalitných fotografií.",
  "Cez WhatsApp komunikovať vedia, ale preferujú email alebo telefón.",
  "Emailom komunikovať vedia.",
  "Berú zálohy.",
  "Platba na faktúru je možná.",
].join(" ");

const heatPumpPriceText = [
  "Pri otázke na cenu tepelného čerpadla GEOTHERM nemá odpovedať jednou vybranou cenníkovou sumou.",
  "Cena závisí hlavne od typu domu, tepelných strát, veľkosti objektu, existujúceho vykurovania, radiátorov alebo podlahovky, prípravy teplej vody, požadovaného výkonu, značky a modelu, rozsahu montáže, úprav kotolne, elektroprípravy, regulácie, vrtov alebo vonkajšej jednotky a dostupných dotácií.",
  "Cenníkové alebo akciové sumy sú len orientačný podklad pre konkrétne zostavy, nie finálna cena pre zákazníkov dom.",
  "Správna odpoveď má prirodzene vysvetliť, že orientačná cena sa dá určiť až po základných údajoch alebo fotkách/projekte.",
].join(" ");

const heatPumpRecommendationWorkflowText = [
  "Pri tepelnom čerpadle chatbot nemá hneď vyberať model ani cenu.",
  "Najprv má zistiť minimálne: či ide o novostavbu alebo rekonštrukciu, približnú vykurovanú plochu v m2, či má dom radiátory alebo podlahové kúrenie a pri rekonštrukcii aj dnešný zdroj tepla.",
  "Ak tieto údaje chýbajú, odpoveď má byť krátka a má položiť presne jednu ďalšiu otázku podľa najdôležitejšieho chýbajúceho údaja.",
  "Poradie zisťovania je: typ projektu, plocha domu, vykurovacia sústava, aktuálny zdroj tepla, či sa má riešiť teplá voda, a či chce zákazník aj chladenie.",
  "Až keď má chatbot dosť údajov, môže povedať predbežné odporúčanie a orientačné cenníkové pásmo.",
  "Knowledge nemá obsahovať hotovú odpoveď na kopírovanie; určuje len cieľ rozhovoru, minimálne údaje a hranice toho, čo sa smie odporučiť.",
].join(" ");

const vaillantArothermPackageGuidanceText = [
  "Interný orientačný podklad z cenníka Vaillant aroTHERM sa používa iba na ľudské predbežné odporúčanie po získaní základných údajov o dome.",
  "Ak používateľ nežiada porovnanie viacerých zostáv, chatbot nemá dávať rozsah viacerých cien naraz. Má vybrať jeden najbližší základný orientačný balík aroTHERM split plus podľa plochy domu a ostatné varianty spomenúť iba pri otázke na alternatívy.",
  "Pre dom 100 až 130 m2 sú orientačné balíky: aroTHERM split plus 55/8.2AS približne 13 890 eur s montážou s DPH, aroTHERM plus 55/6 približne 15 650 eur s montážou s DPH, aroTHERM pro 55/7.1 približne 15 562 eur s montážou s DPH.",
  "Pre dom 140 až 200 m2 je najbližší základný orientačný balík Tepelné čerpadlo Vzduch/Voda aroTHERM split plus, model Vaillant aroTHERM split 75/8.2AS, približne 14 450 eur s montážou s DPH. V zdroji je uvedené: kompaktné riešenie s 190 l zásobníkom teplej vody, ovládanie pomocou termostatu alebo aplikácie, maximálna výstupná teplota 62 stupňov pomocou kompresora, prevádzka až do -25 stupňov a možnosť chladenia.",
  "Pre dom 140 až 200 m2 existujú aj ďalšie varianty: aroTHERM plus 75/6 približne 16 350 eur s montážou s DPH a aroTHERM pro 75/7.1 približne 15 880 eur s montážou s DPH. Nepoužívať ich ako cenový rozsah, ak používateľ nežiada porovnanie variantov.",
  "Pre dom 210 až 260 m2 sú orientačné balíky: aroTHERM split plus 105/5AS približne 16 890 eur s montážou s DPH, aroTHERM plus 105/6 približne 18 520 eur s montážou s DPH, aroTHERM pro 115/7.1 približne 17 440 eur s montážou s DPH.",
  "Pre dom nad 260 do 320 m2 je orientačný podklad len opatrný: aroTHERM split plus 125/5AS približne 17 650 eur s montážou s DPH a aroTHERM plus 125/6 približne 19 225 eur s montážou s DPH; blok aroTHERM pro 125/5AS je v zdroji nejasný a nemá sa používať ako istý fakt.",
  "Pri aroTHERM split plus je v zdroji uvedený zásobník TUV 190 l a maximálna výstupná teplota 62 stupňov cez kompresor.",
  "Pri aroTHERM plus je v zdroji uvedený zásobník TUV 185 l a maximálna výstupná teplota 75 stupňov cez kompresor; pri poslednom výkone je v zdroji pravdepodobný preklep 1850 l a tento údaj sa nemá používať ako istý fakt.",
  "Pri aroTHERM pro je v zdroji uvedený zásobník TUV 190 l a maximálna výstupná teplota 70 stupňov pri nižších výkonoch; blok pre 260 až 320 m2 je nejasný a vyžaduje ručné potvrdenie.",
  "Všetky balíky uvádzajú prevádzku až do -25 stupňov a možnosť chladenia, ale konkrétne chladenie sa má naceniť podľa návrhu.",
  "Pri rekonštrukcii s radiátormi treba vždy zdôrazniť overenie teploty vody, výkonu radiátorov, kotolne, TUV a prípadnej akumulačnej nádrže.",
  "Pri dome nad 320 m2 sa tieto pásma nemajú použiť; chatbot má odporučiť individuálny návrh a nacenenie.",
].join(" ");

export const geothermSupplementalKnowledgePages: SupplementalKnowledgePage[] = [
  {
    url: "internal://geotherm/client-faq",
    slug: "client-faq",
    title: "GEOTHERM klientské FAQ a služby",
    description: "Klientom potvrdené odpovede na praktické otázky o výjazdoch, pôsobnosti, službách, platbách a komunikácii.",
    headings: ["Praktické odpovede pre chatbota"],
    tags: [
      "faq",
      "sluzby",
      "havarijny vyjazd",
      "vikend",
      "mesta",
      "okresy",
      "firmy",
      "male zakazky",
      "kotol",
      "plyn",
      "certifikacia",
      "poistenie",
      "fotky",
      "whatsapp",
      "email",
      "zaloha",
      "faktura",
    ],
    text: serviceFaqText,
    chunks: [
      {
        id: "geotherm-custom-faq-services",
        content: serviceFaqText,
      },
    ],
    images: [],
  },
  {
    url: "internal://geotherm/heat-pump-price-guidance",
    slug: "heat-pump-price-guidance",
    title: "Ako odpovedať na cenu tepelného čerpadla",
    description: "Interné pravidlo: cena tepelného čerpadla závisí od návrhu a nesmie sa zredukovať na jednu vytrhnutú cenníkovú položku.",
    headings: ["Cena závisí od návrhu"],
    tags: ["cena", "tepelne cerpadlo", "nacenenie", "ponuka", "rozpocet", "dotacie"],
    text: heatPumpPriceText,
    chunks: [
      {
        id: "geotherm-custom-heat-pump-price",
        content: heatPumpPriceText,
      },
    ],
    images: [],
  },
  {
    url: "internal://geotherm/heat-pump-recommendation-workflow",
    slug: "heat-pump-recommendation-workflow",
    title: "Ako viesť rozhovor pred odporúčaním tepelného čerpadla",
    description: "Interné pravidlo: chatbot najprv zbiera základné údaje o dome a až potom uzatvára predbežné odporúčanie.",
    headings: ["Najprv follow-up otázky, potom predbežné odporúčanie"],
    tags: ["tepelne cerpadlo", "odporucanie", "follow up", "plocha", "rekonstrukcia", "novostavba", "radiatory", "podlahovka"],
    text: heatPumpRecommendationWorkflowText,
    chunks: [
      {
        id: "geotherm-custom-heat-pump-recommendation-workflow",
        content: heatPumpRecommendationWorkflowText,
      },
    ],
    images: [],
  },
  {
    url: "internal://geotherm/vaillant-arotherm-orientacne-baliky",
    slug: "vaillant-arotherm-orientacne-baliky",
    title: "Vaillant aroTHERM orientačné balíky pre predbežné odporúčanie",
    description: "Interný chatbot-friendly prepis cenníka Vaillant aroTHERM. Ceny sú iba orientačné pásma pre komunikáciu po získaní údajov o dome.",
    headings: ["Orientačné pásma podľa plochy domu", "Kedy balík nepoužiť"],
    tags: ["vaillant", "arotherm", "cena", "orientacna cena", "tepelne cerpadlo", "montaz", "radiatory", "podlahove kurenie"],
    text: vaillantArothermPackageGuidanceText,
    chunks: [
      {
        id: "geotherm-custom-vaillant-arotherm-package-guidance",
        content: vaillantArothermPackageGuidanceText,
      },
    ],
    images: [],
  },
];
