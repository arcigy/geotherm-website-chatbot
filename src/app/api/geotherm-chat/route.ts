import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getRelevantGeothermKnowledge } from "@/lib/geothermKnowledge";
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

function imageMarkdown(images: Array<{ url: string; alt: string }>) {
  return images.map((image) => `![${image.alt}](${image.url})`).join("\n");
}

function insertImagesBeforeFinalQuestion(value: string, markdown: string) {
  const parts = value.trim().split(/\n{2,}/);
  const finalPart = parts.at(-1) ?? "";

  if (parts.length > 1 && finalPart.includes("?") && finalPart.length < 260) {
    return `${parts.slice(0, -1).join("\n\n")}\n\n${markdown}\n\n${finalPart}`;
  }

  return `${value.trim()}\n\n${markdown}`;
}

function appendImageIfUseful(value: string, images: Array<{ url: string; alt: string }>, maxImages: number) {
  const allowedUrls = new Set(images.map((image) => image.url));
  let keptImages = 0;
  const usedUrls = new Set<string>();
  const withoutExtraMarkdownImages = value.replace(/!\[[^\]]*]\(([^)]+)\)/g, (match, url: string) => {
    const cleanUrl = url.trim();
    if (!allowedUrls.has(cleanUrl) || keptImages >= maxImages) return "";
    keptImages += 1;
    usedUrls.add(cleanUrl);
    return match;
  });
  const sanitized = withoutExtraMarkdownImages.replace(
    /^\s*https?:\/\/\S+\.(?:jpe?g|png|webp)(?:\?\S*)?\s*$/gim,
    "",
  );

  if (!images.length) return sanitized.trim();
  if (sanitized.includes("![")) {
    const remaining = images.filter((image) => !usedUrls.has(image.url)).slice(0, maxImages - keptImages);
    if (!remaining.length) return sanitized.trim();
    return insertImagesBeforeFinalQuestion(sanitized, imageMarkdown(remaining));
  }
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
    ? "Použi presne tento kompaktný formát: ### Krátky nadpis\n1 veta úvodu.\n| Položka | Kedy dáva zmysel | Hlavný prínos |\n|---|---|---|\n| Názov | krátky text | krátky text |\nPotom 1 krátku otázku na pokračovanie. Nikdy nezarovnávaj tabuľku medzerami. Nepouži vnorené odrážky."
    : "Použi krátky nadpis, 1 až 2 stručné sekcie a najviac jeden krátky zoznam. Skonči jednou otázkou, ktorá posunie zákazníka k výberu riešenia.";

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
- Ak používateľ pýta produkt, článok, dotáciu, montáž, servis, značky, typy čerpadiel alebo konkrétnu technológiu a je dostupný vhodný obrázok, vlož relevantný obrázok Markdownom.
- Bežne použi 1 obrázok. Pri porovnaní, typoch, značkách alebo možnostiach môžeš použiť 2 obrázky, nikdy viac.
- Obrázky môžeš použiť iba z povoleného zoznamu. Nevymýšľaj URL obrázkov.
- Obrázok vlož prirodzene za prvý krátky vysvetľujúci odsek alebo za tabuľku.
- Odpoveď drž stručnú. Na konci vždy polož jednu prirodzenú otázku, aby zákazník pokračoval v rozhovore.

Formát tejto odpovede:
${formatInstruction}

Povolené obrázky:
${allowedImages || "Pre túto otázku nebol nájdený vhodný obrázok."}

Vybrané podklady:
${knowledge.context}`,
        temperature: 0.35,
        maxOutputTokens: 420,
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
