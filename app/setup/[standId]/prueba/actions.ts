"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

export async function finalizeStandStatus(
  standId: string,
  status: "confirmed" | "pending"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/setup");
  }

  // RLS scopes this to the caller's own stands; a mismatched standId simply
  // updates nothing rather than leaking whether some other stand exists.
  const { error } = await supabase
    .from("stands")
    .update({ status })
    .eq("id", standId);

  if (error) {
    console.error("[finalizeStandStatus] update failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }

  redirect(`/setup/${standId}/tarjeta`);
}
