import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import {
  nextFollowUpQuestion,
  normalizeText,
  stateForPrompt,
  topicLabel,
  updateConversationState,
  type ChatMessage,
  type ConversationState,
} from "@/lib/geothermConversation";
import { getGeothermImagesByUrl, getRelevantGeothermKnowledge } from "@/lib/geothermKnowledge";
import { geothermSystemPrompt } from "@/lib/geothermPrompt";

function cleanMarkdownResponse(value: string) {
  return value
    .split("\n")
    .map((line) => (line.includes("|") ? line.replace(/ {2,}/g, " ").trim() : line))
    .join("\n")
    .trim();
}

function ensureMarkdownHeading(value: string) {
  if (/^#{1,3}\s+/m.test(value)) return value;
  return `### GEOTHERM odpoveď\n\n${value}`;
}

function enforceSingleFollowUpQuestion(value: string, followUpQuestion: string) {
  const questionCount = (value.match(/\?/g) || []).length;

  if (questionCount === 1) return value.trim();

  const withoutQuestions = value.replace(/\?/g, ".").trim();
  return `${withoutQuestions}\n\n${followUpQuestion}`;
}

function imageMarkdown(images: Array<{ url: string; alt: string; description?: string }>) {
  const markdownImages = images
    .map((image) => `![${image.description || image.alt}](${image.url})`)
    .join("\n");
  const captions = images
    .map((image, index) => `${images.length > 1 ? `${index + 1}. ` : ""}${image.description || image.alt}`)
    .join("; ");

  return `${markdownImages}\n\n*${images.length > 1 ? "Obrázky" : "Obrázok"}: ${captions}.*`;
}

function insertImagesBeforeFinalQuestion(value: string, markdown: string) {
  const parts = value.trim().split(/\n{2,}/);
  const finalPart = parts.at(-1) ?? "";

  if (parts.length > 1 && finalPart.includes("?") && finalPart.length < 260) {
    return `${parts.slice(0, -1).join("\n\n")}\n\n${markdown}\n\n${finalPart}`;
  }

  return `${value.trim()}\n\n${markdown}`;
}

function appendImageIfUseful(value: string, images: Array<{ url: string; alt: string; description?: string }>, maxImages: number) {
  const sanitized = value
    .replace(/!\[[^\]]*]\(([^)]+)\)/g, "")
    .replace(/^\s*\*?Obr[áa]z(?:ok|ky):.*$/gim, "")
    .replace(
    /^\s*https?:\/\/\S+\.(?:jpe?g|png|webp)(?:\?\S*)?\s*$/gim,
    "",
    );

  if (!images.length) return sanitized.trim();
  return insertImagesBeforeFinalQuestion(sanitized, imageMarkdown(images.slice(0, maxImages)));
}

function imageLimitFor(query: string) {
  return /porovnaj|porovnanie|rozdiel|\bvs\.?\b|značky|znacky|typy|druhy|možnosti|moznosti|nibe.*vaillant|vaillant.*nibe/i.test(
    query,
  )
    ? 2
    : 1;
}

function isRelevantImageForQuery(image: { alt: string; description?: string; useWhen?: string }, query: string) {
  const imageText = normalizeText(`${image.alt} ${image.description ?? ""} ${image.useWhen ?? ""}`);
  const queryText = normalizeText(query);

  if (imageText.includes("rekuper") && !/(rekuper|vetran|vzduch|filter)/.test(queryText)) return false;
  if (imageText.includes("dotac") && !/(dotac|oze|poukaz|zelena)/.test(queryText)) return false;
  if (imageText.includes("podlah") && !/(podlah|kuren|vykurov|komfort)/.test(queryText)) return false;
  if (imageText.includes("strop") && !/(strop|chladen|klimatiz|stenov)/.test(queryText)) return false;

  return true;
}

function fallbackResponse(topic: string, wantsComparison: boolean) {
  if (wantsComparison) {
    return `### Rýchle porovnanie

| Možnosť | Kedy dáva zmysel | Hlavný prínos |
|---|---|---|
| Tepelné čerpadlo | keď chcete úsporné vykurovanie a chladenie | nižšie prevádzkové náklady |
| Rekuperácia | keď chcete čerstvý vzduch bez veľkých tepelných strát | komfort a zdravšia vnútorná klíma |
| Podlahové alebo stenové riešenie | pri novostavbe alebo rekonštrukcii | rovnomerný komfort v miestnostiach |

Najlepšie riešenie treba vybrať podľa domu, izolácie a súčasného zdroja tepla.`;
  }

  return `### ${topic || "GEOTHERM odpoveď"}

Pri tejto téme je najdôležitejšie navrhnúť riešenie podľa konkrétneho domu, nie všeobecne. GEOTHERM preto pri odporúčaní zohľadňuje typ stavby, plochu, súčasný zdroj tepla, očakávaný komfort a možnosti dotácií.`;
}

function extractMarkdownImageUrls(value: string) {
  return [...value.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)].map((match) => match[1].trim());
}

function hasSituation(value: string) {
  return /\b(novostav|novy dom|staviam|staviame|rekonstruk|rekonstru|stary dom|stars[iy] dom)\b/.test(value);
}

function hasSize(value: string) {
  return /\b\d{2,4}\s*(m2|m 2|m²|metrov|metrovy|metrovym|m)\b/.test(value);
}

function hasCurrentSystem(value: string) {
  return /\b(plyn|plynom|kotol|radiator|radiatory|elektr|krb|tuh[eé]|drevo|uhlie|od nuly|nuly|nemame|nemam|podlahov)\b/.test(value);
}

function hasPriority(value: string) {
  return /\b(lacn|najlacn|usetrit|uspor|vstupn|dlhodob|prevadzk|naklad|navratnost|komfort|ticho)\b/.test(value);
}

function conversationGuideInstruction(messages: ChatMessage[]) {
  const userText = normalizeText(
    messages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join(" "),
  );

  if (!hasSituation(userText)) {
    return 'Na konci polož presne jednu otázku: "Staviate nový dom alebo rekonštruujete?"';
  }

  if (!hasSize(userText)) {
    return 'Na konci polož presne jednu otázku: "Aká je približne veľkosť domu v m²?"';
  }

  if (!hasCurrentSystem(userText)) {
    return 'Na konci polož presne jednu otázku: "Máte už nejaké kúrenie alebo riešite systém od nuly?"';
  }

  if (!hasPriority(userText)) {
    return 'Na konci polož presne jednu otázku: "Chcete skôr ušetriť na začiatku alebo mať čo najnižšie náklady dlhodobo?"';
  }

  return "Používateľ už dal základné údaje. Odporuč stručný ďalší krok a na konci polož presne jednu konkrétnu otázku, ktorá pomôže pripraviť odborný návrh.";
}

function fallbackFollowUpQuestion(messages: ChatMessage[]) {
  const userText = normalizeText(
    messages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join(" "),
  );

  if (!hasSituation(userText)) return "Staviate nový dom alebo rekonštruujete?";
  if (!hasSize(userText)) return "Aká je približne veľkosť domu v m²?";
  if (!hasCurrentSystem(userText)) return "Máte už nejaké kúrenie alebo riešite systém od nuly?";
  if (!hasPriority(userText)) return "Chcete skôr ušetriť na začiatku alebo mať čo najnižšie náklady dlhodobo?";

  return "Chcete, aby som vám z toho pripravil stručné odporúčanie ďalšieho kroku?";
}

function isImageMetaQuestion(value: string) {
  const raw = value.toLowerCase();
  if ((raw.includes("obr") || raw.includes("fot")) && (raw.includes("čo") || raw.includes("co") || raw.includes("aké") || raw.includes("ake") || raw.includes("poslal"))) {
    return true;
  }

  const normalized = normalizeText(value);
  const asksAboutExistingImage =
    normalized.includes("obraz") || normalized.includes("fotk") || normalized.includes("foto");
  const isMetaWording = /co|ake|aky|ktore|poslal|zobrazuj|vidim|vysvetli|popis/.test(normalized);

  return asksAboutExistingImage && isMetaWording;
}

function answerImageMetaQuestion(messages: ChatMessage[]) {
  const previousImageUrls = messages
    .filter((message) => message.role === "assistant")
    .flatMap((message) => extractMarkdownImageUrls(message.content));
  const images = getGeothermImagesByUrl(previousImageUrls).slice(0, 4);

  if (!images.length) {
    return "### Obrázky v odpovedi\n\nV predchádzajúcej odpovedi nevidím žiadny uložený obrázok, ktorý by som vedel spoľahlivo pomenovať.\n\nChcete, aby som k tejto téme vybral vhodný produktový obrázok z databázy GEOTHERM?";
  }

  const rows = images
    .map((image) => {
      const useWhen = image.useWhen
        .replace(/^použi pri/i, "hodí sa pri")
        .replace(/^použi iba vtedy, keď/i, "hodí sa, keď");

      return `| ${image.alt || "Obrázok GEOTHERM"} | ${image.description} | ${useWhen} |`;
    })
    .join("\n");

  return `### Čo zobrazujú poslané obrázky\n\n| Obrázok | Čo je na ňom | Prečo sa hodí |\n|---|---|---|\n${rows}\n\n${imageMarkdown(images)}\n\nChcete, aby som pri ďalších odpovediach zobrazoval pod obrázkami vždy aj takýto krátky popis?`;
}

function deterministicResponse(latestUserMessage: ChatMessage, state: ConversationState) {
  const text = normalizeText(latestUserMessage.content);
  const topic = topicLabel(state.lastTopic);
  const latestHasContact = /@|(?:\+421\s*)?(?:0)?9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}|vol[aá]m sa/i.test(
    latestUserMessage.content,
  );

  if (state.contactRefused) {
    return "Rozumiem, kontaktné údaje dávať nemusíte. Viem pokračovať orientačne a pomôcť vám ujasniť riešenie bez tlaku.";
  }

  if (latestHasContact) {
    return "Ďakujem, poznačil som si to. Kontaktné údaje nebudem zbytočne opakovať; dôležitejšie je doplniť technické údaje, aby bol podklad užitočný.";
  }

  if (state.lead.intent === "callback") {
    return "Rozumiem, chcete spätný kontakt. Najprv si bezpečne poznačíme len potrebný kontakt a potom doplníme údaje o dome, aby bolo jasné, s čím vám majú pomôcť.";
  }

  if (state.lead.intent === "quote" || state.lead.intent === "price_estimate") {
    return "Orientácia v cene dáva zmysel až po základných údajoch o dome. Bez nich by bola suma príliš hrubý odhad a mohla by zavádzať.";
  }

  if (/(predtym|vratme|podla toho|pre moj pripad|plati to aj)/.test(text)) {
    const facts = state.knownFacts.slice(0, 4).join(" ");
    return `Podľa toho, čo ste už napísali, platí hlavne toto: ${facts || "zatiaľ nemám dosť údajov na presné odporúčanie"}. Preto by som odporúčanie viazal na váš konkrétny dom, nie na všeobecné riešenie.`;
  }

  if (state.project.type && state.project.houseSizeM2 && state.project.priority) {
    const facts = state.knownFacts.slice(0, 4).join(" ");
    return `Podľa vašich údajov: ${facts}. Odporúčanie by som držal pri riešení na mieru, aby sedelo na dom, rozpočet aj očakávaný komfort.`;
  }

  if (topic) {
    return `K téme ${topic}: dá sa to riešiť, ale správny návrh závisí od domu a existujúceho systému. Zatiaľ si skladám obraz o vašej situácii, aby odporúčanie nebolo všeobecné.`;
  }

  return "Rozumiem. Najlepšie bude ísť postupne, aby sme zistili, aké riešenie dáva zmysel pre váš dom a rozpočet.";
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY environment variable." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as {
    messages?: ChatMessage[];
    conversationState?: ConversationState | null;
    testMode?: boolean;
  };
  const allMessages = body.messages ?? [];
  const messages = allMessages.slice(-12);
  const latestUserMessage = [...allMessages].reverse().find((message) => message.role === "user");
  const conversationState = updateConversationState(allMessages, body.conversationState);
  const fallbackQuestion = fallbackFollowUpQuestion(messages);
  const followUpQuestion = nextFollowUpQuestion(conversationState) || fallbackQuestion;

  if (!latestUserMessage?.content?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  if (isImageMetaQuestion(latestUserMessage.content)) {
    return NextResponse.json({
      message: enforceSingleFollowUpQuestion(answerImageMetaQuestion(messages), followUpQuestion),
      conversationState,
    });
  }

  if (body.testMode) {
    return NextResponse.json({
      message: enforceSingleFollowUpQuestion(
        ensureMarkdownHeading(deterministicResponse(latestUserMessage, conversationState)),
        followUpQuestion,
      ),
      conversationState,
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const queryContext = messages
    .slice(-4)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
  const knowledge = getRelevantGeothermKnowledge(queryContext);
  const maxImages = imageLimitFor(queryContext);
  const relevantImages = knowledge.images.filter((image) => isRelevantImageForQuery(image, queryContext));
  const allowedImages = relevantImages
    .map(
      (image, index) =>
        `${index + 1}. ${image.alt}: ${image.url}\n   Čo je na obrázku: ${image.description}\n   Použi keď: ${image.useWhen}`,
    )
    .join("\n");
  const wantsComparison = /porovnaj|porovnanie|rozdiel|\bvs\.?\b|výhody|vyhody|značky|znacky|možnosti|moznosti/i.test(
    queryContext,
  );
  const conversationGuide = `${conversationGuideInstruction(messages)} Aktuálne platí finálna otázka: "${followUpQuestion}"`;
  const formatInstruction = wantsComparison
    ? "Použi presne tento kompaktný formát: ### Krátky nadpis\n1 veta úvodu.\n| Položka | Kedy dáva zmysel | Hlavný prínos |\n|---|---|---|\n| Názov | krátky text | krátky text |\nPotom 1 krátku otázku na pokračovanie. Celkovo max 100 slov. Nikdy nezarovnávaj tabuľku medzerami. Nepouži vnorené odrážky."
    : "Použi krátky nadpis, 1 stručnú sekciu a najviac jeden krátky zoznam. Celkovo max 75 slov. Nepoužívaj tabuľku, ak používateľ výslovne nežiada porovnanie. Skonči jednou otázkou, ktorá posunie zákazníka k výberu riešenia.";

  let generatedText: string;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      config: {
        systemInstruction: `${geothermSystemPrompt}

Používaj primárne vybrané podklady zo stránky GEOTHERM. Nepoužívaj všeobecné dohady tam, kde zdroj obsahuje konkrétnu informáciu.
Ak v podkladoch odpoveď nie je, povedz, že to treba overiť u GEOTHERM.

Práca so zdrojmi:
- Odpovedaj podľa relevantných pasáží nižšie, nie podľa všeobecnej znalosti.
- Nespomínaj interné označenia ZDROJ, chunk ani retrieval.
- Nevkladaj Markdown obrázky sám. Systém ich pridá automaticky z povoleného zoznamu.
- Ak v texte spomenieš obrázok, pomenuj vecne čo zobrazuje podľa popisu v povolenom zozname.
- Obrázky môžeš opisovať iba podľa poľa "Čo je na obrázku". Nevymýšľaj, čo je na nich.
- Odpoveď drž stručnú. Na konci vždy polož presne jednu prirodzenú otázku, aby zákazník pokračoval v rozhovore.

Konverzačné riadenie:
${conversationGuide}

Aktuálna pamäť rozhovoru:
${stateForPrompt(conversationState)}

Formát tejto odpovede:
${formatInstruction}

Povolené obrázky:
${allowedImages || "Pre túto otázku nebol nájdený vhodný obrázok."}

Vybrané podklady:
${knowledge.context}`,
        temperature: 0.35,
        maxOutputTokens: 340,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    generatedText = response.text ?? fallbackResponse(knowledge.sources[0]?.title ?? "", wantsComparison);
  } catch {
    generatedText = fallbackResponse(knowledge.sources[0]?.title ?? "", wantsComparison);
  }

  const message = appendImageIfUseful(
    ensureMarkdownHeading(
      cleanMarkdownResponse(
        generatedText,
      ),
    ),
        relevantImages,
    maxImages,
  );

  return NextResponse.json({
    message: enforceSingleFollowUpQuestion(message, followUpQuestion),
    conversationState,
  });
}
