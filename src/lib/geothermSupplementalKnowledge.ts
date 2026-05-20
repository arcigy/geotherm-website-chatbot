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
];
