import "server-only";

import { generateCardBody } from "@/app/lib/gemini/card-text";
import type { createClient } from "@/app/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Reads the stand's card body if it already exists; otherwise generates it
 * once and persists it. The unique constraint on card_texts.stand_id
 * (0003_card_texts_unique_stand.sql) makes the insert race-safe: if two
 * requests generate concurrently, `on conflict do nothing` lets exactly one
 * write win, and the final select below reads back whichever one that was.
 * A card is never regenerated once a row exists — reprints are byte-identical
 * by construction.
 */
export async function getOrCreateCardBody(
  supabase: SupabaseServerClient,
  standId: string,
  standType: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("card_texts")
    .select("body")
    .eq("stand_id", standId)
    .maybeSingle();

  if (existing) {
    return existing.body;
  }

  const generatedBody = await generateCardBody(standType);

  // With `ignoreDuplicates`, PostgREST turns a lost race into ON CONFLICT DO
  // NOTHING — a normal success with no returned row, not an error. So an
  // `error` here is always a real failure (e.g. the unique constraint is
  // missing), never a benign duplicate. It must not be swallowed: silently
  // falling back to `generatedBody` would serve unpersisted text that a
  // reprint could never reproduce, breaking the "byte-identical every time"
  // guarantee without anyone noticing.
  const { error: upsertError } = await supabase.from("card_texts").upsert(
    { stand_id: standId, body: generatedBody },
    { onConflict: "stand_id", ignoreDuplicates: true }
  );

  if (upsertError) {
    console.error("[getOrCreateCardBody] upsert failed", {
      code: upsertError.code,
      message: upsertError.message,
      details: upsertError.details,
      hint: upsertError.hint,
    });
    throw new Error("No se pudo guardar el texto de la tarjeta.");
  }

  const { data: finalRow, error: selectError } = await supabase
    .from("card_texts")
    .select("body")
    .eq("stand_id", standId)
    .single();

  if (selectError || !finalRow) {
    console.error("[getOrCreateCardBody] final select failed", {
      code: selectError?.code,
      message: selectError?.message,
    });
    throw new Error("No se pudo leer el texto de la tarjeta guardada.");
  }

  return finalRow.body;
}
