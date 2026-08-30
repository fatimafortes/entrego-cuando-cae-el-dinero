import "server-only";

import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-3.5-flash-lite";

const PROMPT =
  "¿Esta foto de una pantalla de celular muestra una notificación de " +
  "depósito bancario? No leas montos, no leas nombres, no evalúes si la " +
  "notificación es legítima. Responde únicamente si una notificación de " +
  "depósito está visible en la pantalla, sí o no.";

export type NotificationCheckResult = {
  visible: boolean;
  reason: string;
};

export class NotificationCheckError extends Error {}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return client;
}

export async function checkDepositNotification(
  imageBase64: string,
  mimeType: string
): Promise<NotificationCheckResult> {
  let response;
  try {
    response = await getClient().models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      config: {
        temperature: 0,
        maxOutputTokens: 200,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            notificationVisible: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
          },
          required: ["notificationVisible", "reason"],
        },
      },
    });
  } catch (cause) {
    throw new NotificationCheckError("Gemini request failed", {
      cause,
    });
  }

  const text = response.text;
  if (!text) {
    throw new NotificationCheckError("Gemini returned no text output");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (cause) {
    throw new NotificationCheckError("Gemini returned invalid JSON", {
      cause,
    });
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).notificationVisible !==
      "boolean"
  ) {
    throw new NotificationCheckError("Gemini response missing expected shape");
  }

  const result = parsed as { notificationVisible: boolean; reason?: string };
  return {
    visible: result.notificationVisible,
    reason: typeof result.reason === "string" ? result.reason : "",
  };
}
