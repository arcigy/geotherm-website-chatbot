import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getGeothermImagesByUrl, getRelevantGeothermKnowledge } from "@/lib/geothermKnowledge";
import { geothermSystemPrompt } from "@/lib/geothermPrompt";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

function ensureFollowUp(value: string) {
  const finalBlock = value.trim().split(/\n{2,}/).at(-1) ?? "";
  if (finalBlock.includes("?")) return value;
  return `${value.trim()}\n\n**Čo chcete preveriť ďalej:** ide o novostavbu alebo rekonštrukciu a aká je približná plocha domu?`;
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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ");
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

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY environment variable." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { messages?: ChatMessage[] };
  const messages = body.messages?.slice(-12) ?? [];
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

  if (!latestUserMessage?.content?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  if (isImageMetaQuestion(latestUserMessage.content)) {
    return NextResponse.json({ message: answerImageMetaQuestion(messages) });
  }

  const ai = new GoogleGenAI({ apiKey });
  const queryContext = messages
    .slice(-4)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
  const knowledge = getRelevantGeothermKnowledge(queryContext);
  const maxImages = imageLimitFor(queryContext);
  const allowedImages = knowledge.images
    .map(
      (image, index) =>
        `${index + 1}. ${image.alt}: ${image.url}\n   Čo je na obrázku: ${image.description}\n   Použi keď: ${image.useWhen}`,
    )
    .join("\n");
  const wantsComparison = /porovnaj|porovnanie|rozdiel|\bvs\.?\b|výhody|vyhody|značky|znacky|možnosti|moznosti/i.test(
    queryContext,
  );
  const formatInstruction = wantsComparison
    ? "Použi presne tento kompaktný formát: ### Krátky nadpis\n1 veta úvodu.\n| Položka | Kedy dáva zmysel | Hlavný prínos |\n|---|---|---|\n| Názov | krátky text | krátky text |\nPotom 1 krátku otázku na pokračovanie. Celkovo max 170 slov. Nikdy nezarovnávaj tabuľku medzerami. Nepouži vnorené odrážky."
    : "Použi krátky nadpis, 1 až 2 stručné sekcie a najviac jeden krátky zoznam. Celkovo max 130 slov. Nepoužívaj tabuľku, ak používateľ výslovne nežiada porovnanie. Skonči jednou otázkou, ktorá posunie zákazníka k výberu riešenia.";

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
- Odpoveď drž stručnú. Na konci vždy polož jednu prirodzenú otázku, aby zákazník pokračoval v rozhovore.

Formát tejto odpovede:
${formatInstruction}

Povolené obrázky:
${allowedImages || "Pre túto otázku nebol nájdený vhodný obrázok."}

Vybrané podklady:
${knowledge.context}`,
        temperature: 0.35,
        maxOutputTokens: 560,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    generatedText = response.text ?? fallbackResponse(knowledge.sources[0]?.title ?? "", wantsComparison);
  } catch {
    generatedText = fallbackResponse(knowledge.sources[0]?.title ?? "", wantsComparison);
  }

  return NextResponse.json({
    message: ensureFollowUp(
      appendImageIfUseful(
        ensureMarkdownHeading(
          cleanMarkdownResponse(
            generatedText,
          ),
        ),
        knowledge.images,
        maxImages,
      ),
    ),
  });
}
