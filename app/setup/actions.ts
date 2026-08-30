"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import {
  hasStandErrors,
  normalizeStandInput,
  validateStandInput,
  type StandFieldErrors,
  type StandInput,
} from "@/app/lib/validation/stand";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type StandFormState = {
  values: StandInput;
  errors: StandFieldErrors;
  formError?: string;
};

function readStandInput(formData: FormData): StandInput {
  return {
    merchantName: String(formData.get("merchantName") ?? ""),
    standType: String(formData.get("standType") ?? ""),
    clabe: String(formData.get("clabe") ?? ""),
  };
}

export async function createStand(
  _prevState: StandFormState,
  formData: FormData
): Promise<StandFormState> {
  const rawInput = readStandInput(formData);
  const errors = validateStandInput(rawInput);

  if (hasStandErrors(errors)) {
    return { values: rawInput, errors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/setup");
  }

  const input = normalizeStandInput(rawInput);
  const { error } = await supabase.from("stands").insert({
    supplier_id: user.id,
    merchant_name: input.merchantName,
    stand_type: input.standType,
    clabe: input.clabe,
  });

  if (error) {
    console.error("[createStand] insert into stands failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return {
      values: rawInput,
      errors: {},
      formError: "No se pudo guardar el puesto. Intenta de nuevo.",
    };
  }

  redirect("/stands");
}
