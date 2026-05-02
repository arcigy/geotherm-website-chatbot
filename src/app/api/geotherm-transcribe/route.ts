import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

type TranscribeRequest = {
  audioBase64?: string;
  mimeType?: string;
};

function cleanTranscription(value: string) {
  return value
    .replace(/^["'„“”]+|["'„“”]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY environment variable." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as TranscribeRequest;

  if (!body.audioBase64) {
    return NextResponse.json({ error: "Audio is required." }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: body.audioBase64,
              mimeType: body.mimeType || "audio/webm",
            },
          },
          {
            text: `Prepíš hlasovú nahrávku do čistého textu pre vstup do chatbota GEOTHERM.

Pravidlá:
- 95 % nahrávok bude po slovensky, približne 5 % po anglicky.
- Zachovaj jazyk hovoriaceho. Neprekladaj.
- Vráť iba prepísaný text, bez úvodu, bez poznámok, bez markdownu.
- Oprav zjavné preklepy zo speech-to-text, ale nemeň význam.
- Ak je reč nejasná, zachovaj najpravdepodobnejší význam v prirodzenej slovenčine.
- Čísla píš prirodzene podľa kontextu, napríklad 120 m2, 3 800 eur, 8 kW.
- Odborné názvy a značky môžeš očakávať najmä v oblasti vykurovania, chladenia, vetrania a OZE.

Preferované odborné výrazy pre kontext:
- tepelné čerpadlo vzduch-voda
- tepelné čerpadlo zem-voda
- rekuperácia vzduchu
- podlahové vykurovanie
- fotovoltika
- zásobník teplej vody
- ekvitermická regulácia
- chladiaci konvektor
- Vaillant aroTHERM plus
- Vaillant recoVAIR
- NIBE S2125
- Viessmann Vitocal
- Daikin Altherma
- Panasonic Aquarea
- Stiebel Eltron WPL
- dotácia Zelená domácnostiam
- sezónny vykurovací faktor SCOP
- pasívny dom a nízkoenergetický dom`,
          },
        ],
      },
    ],
    config: {
      temperature: 0.1,
      maxOutputTokens: 220,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  });

  return NextResponse.json({
    text: cleanTranscription(response.text ?? ""),
  });
}
