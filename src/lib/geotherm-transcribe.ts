import { GoogleGenAI } from "@google/genai";

export type GeothermTranscribeInput = {
  audioBase64: string;
  mimeType?: string;
};

export type GeothermTranscribeResult = {
  text: string;
  model: string;
  durationMs: number;
};

const maxAudioBase64Length = 12 * 1024 * 1024;

function cleanTranscription(value: string) {
  return value
    .replace(/^["'„“”]+|["'„“”]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function transcribeModel() {
  return process.env.GEMINI_TRANSCRIBE_MODEL || process.env.GEMINI_STT_MODEL || "gemini-2.5-flash-lite";
}

function transcribePrompt() {
  return `Prepíš hlasovú nahrávku do čistého textu pre vstup do GEOTHERM chatbota.

Pravidlá:
- Väčšina nahrávok je po slovensky, časť môže byť po anglicky. Zachovaj jazyk hovoriaceho, neprekladaj.
- Vráť iba prepísaný text. Bez úvodu, poznámok, markdownu a vysvetlení.
- Oprav len zjavné chyby prepisu, nemen význam.
- Ak je reč nejasná, vráť najpravdepodobnejší prirodzený text.
- Čísla a jednotky píš prakticky: 120 m2, 8 kW, 3 800 eur, 250 l, 45 dB.
- Technické skratky rozpoznaj aj pri nadiktovaní po písmenách.

Preferované výrazy a skratky:
- TČ alebo tepelné čerpadlo, vzduch-voda, zem-voda, voda-voda, vzduch-vzduch
- TÚV, VZT, COP, SCOP, SPF, kW, kWh, m2, m3, dB, R32, R290
- monoblok, split, invertor, bivalentný zdroj, ekvitermická regulácia
- akumulačná nádrž, akumulačka, zásobník teplej vody, radiátory, podlahovka
- rekuperácia, stropné chladenie, fancoil, fan-coil, fotovoltika
- Vaillant aroTHERM plus, aroTHERM split, recoVAIR
- NIBE S2125, F2120, F2040, F2050
- IVT, Stiebel Eltron, Daikin, Mitsubishi, Zehnder
- Zelená domácnostiam, dotácia, obhliadka, cenová ponuka, servis`;
}

export async function transcribeGeothermAudio(input: GeothermTranscribeInput): Promise<GeothermTranscribeResult> {
  const startedAt = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY environment variable.");
  if (!input.audioBase64) throw new Error("Audio is required.");
  if (input.audioBase64.length > maxAudioBase64Length) throw new Error("Audio is too large.");

  const model = transcribeModel();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: input.audioBase64,
              mimeType: input.mimeType || "audio/webm",
            },
          },
          { text: transcribePrompt() },
        ],
      },
    ],
    config: {
      temperature: 0,
      maxOutputTokens: 220,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  });

  return {
    text: cleanTranscription(response.text ?? ""),
    model,
    durationMs: Date.now() - startedAt,
  };
}
