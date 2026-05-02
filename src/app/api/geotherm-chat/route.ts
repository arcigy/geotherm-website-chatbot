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

function appendImageIfUseful(value: string, images: Array<{ url: string; alt: string }>) {
  if (!images.length || value.includes("![")) return value;

  const [image] = images;
  return `${value.trim()}\n\n![${image.alt}](${image.url})`;
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
  const allowedImages = knowledge.images
    .map((image, index) => `${index + 1}. ${image.alt}: ${image.url}`)
    .join("\n");
  const wantsComparison = /porovnaj|porovnanie|rozdiel|vs\.?|výhody|vyhody|značky|znacky|možnosti|moznosti/i.test(
    queryContext,
  );
  const formatInstruction = wantsComparison
    ? "Použi presne tento kompaktný formát: ### Krátky nadpis\n1 veta úvodu.\n| Položka | Kedy dáva zmysel | Hlavný prínos |\n|---|---|---|\n| Názov | krátky text | krátky text |\nPotom 1 krátky záver. Nikdy nezarovnávaj tabuľku medzerami. Nepouži vnorené odrážky."
    : "Použi krátky nadpis, stručné sekcie a maximálne jeden krátky zoznam.";

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
- Ak používateľ pýta produkt, článok, dotáciu, montáž, servis alebo konkrétnu technológiu a je dostupný vhodný obrázok, vlož 1 relevantný obrázok Markdownom.
- Obrázky môžeš použiť iba z povoleného zoznamu. Nevymýšľaj URL obrázkov.
- Obrázok vlož prirodzene za prvý krátky vysvetľujúci odsek alebo za tabuľku.

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

  return NextResponse.json({
    message: appendImageIfUseful(
      cleanMarkdownResponse(
        response.text ?? "Nepodarilo sa pripraviť odpoveď. Skúste otázku preformulovať.",
      ),
      knowledge.images,
    ),
  });
}
