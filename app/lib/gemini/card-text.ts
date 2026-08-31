import "server-only";

import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-3.5-flash-lite";
const MAX_WORDS = 20;

function buildPrompt(rawStandType: string, previousTooLong?: string): string {
  // The supplier types this into a free-text field ("Leche y maiz"), and the
  // model echoes it back into the middle of a sentence — lowercase it so it
  // never lands as a stray capital letter mid-sentence on the printed card.
  const standType = rawStandType.toLowerCase();

  const retryNote = previousTooLong
    ? `\n\nTu intento anterior tenía demasiadas palabras: "${previousTooLong}". Sé más breve esta vez, sin perder ninguna de las dos oraciones.`
    : "";

  return `Escribe exactamente dos oraciones cortas para una tarjeta que se cuelga en un puesto de mercado que vende "${standType}". No incluyas título, firma, ni comillas.

Oración 1: dice que NO se entrega la mercancía solo con un comprobante de transferencia, nombrando el producto real ("${standType}") en vez de una palabra genérica como "mercancía". Escribe "${standType}" tal cual, en minúsculas, salvo que empiece la oración.
Oración 2: dice que sí se entrega cuando suena la notificación del banco en el teléfono.

Reglas: español de México, nivel de lectura bajo (el lector lee despacio), sin tecnicismos, máximo 20 palabras en total contando las dos oraciones. No repitas la palabra "comprobante" más de una vez. No menciones nombres de bancos.${retryNote}`;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// How far the sentence-safe fallback may run past MAX_WORDS rather than
// drop the second sentence. Found by stress-testing generateCardBody: about
// 1 in 6 real generations reached this fallback, and dropping the second
// sentence there doesn't just make the card longer than intended — it
// deletes the affirmative half of the rule (when goods DO get delivered),
// leaving a card that only says what doesn't happen. A card a few words
// over budget but complete serves the product's purpose; a shorter card
// missing half its message does not.
const FALLBACK_OVERAGE_ALLOWANCE = 8;

/**
 * Keeps only complete sentences, never cutting mid-sentence or mid-word.
 * The prompt always asks for exactly two sentences (the refusal, then the
 * affirmative rule), so this prefers keeping both — even somewhat over
 * maxWords — over silently reducing the card to just the first sentence.
 * Only falls back to the first sentence alone if both together blow past
 * the allowance; the first sentence is always kept whole regardless of its
 * own length, since a long complete sentence still beats a fragment.
 */
function trimToCompleteSentences(text: string, maxWords: number): string {
  const trimmed = text.trim();
  const sentences = (trimmed.match(/[^.!?]+[.!?]+/g) ?? [trimmed]).map((s) =>
    s.trim()
  );

  if (sentences.length <= 1) return sentences[0] || trimmed;

  const first = sentences[0];
  const firstTwo = `${first} ${sentences[1]}`;

  if (wordCount(firstTwo) <= maxWords + FALLBACK_OVERAGE_ALLOWANCE) {
    return firstTwo;
  }

  return first;
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return client;
}

async function requestCardBody(prompt: string): Promise<string> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.2,
      maxOutputTokens: 200,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { body: { type: Type.STRING } },
        required: ["body"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned no text output for card body");
  }

  const parsed = JSON.parse(text) as { body?: unknown };
  if (typeof parsed.body !== "string" || parsed.body.trim().length === 0) {
    throw new Error("Gemini response missing expected card body");
  }

  return parsed.body.trim();
}

export async function generateCardBody(standType: string): Promise<string> {
  const first = await requestCardBody(buildPrompt(standType));
  if (wordCount(first) <= MAX_WORDS) return first;

  const second = await requestCardBody(buildPrompt(standType, first));
  if (wordCount(second) <= MAX_WORDS) return second;

  // Model missed the limit twice. Never serve a mid-sentence fragment: keep
  // whichever attempt is shorter and cut it at a sentence boundary instead.
  const best = wordCount(second) < wordCount(first) ? second : first;
  console.error("[generateCardBody] over word limit after retry, trimming to complete sentences", {
    standType,
    firstWords: wordCount(first),
    secondWords: wordCount(second),
  });
  return trimToCompleteSentences(best, MAX_WORDS);
}
