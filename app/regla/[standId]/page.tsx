import { notFound } from "next/navigation";
import { createServiceClient } from "@/app/lib/supabase/service";
import { CARD_HEADLINE, CARD_UNIVERSAL_LINE } from "@/app/lib/card-copy";

export default async function RulePage({
  params,
}: PageProps<"/regla/[standId]">) {
  const { standId } = await params;

  const supabase = createServiceClient();

  // Only the columns safe to render publicly are ever selected — no clabe,
  // no supplier_id, no timestamps. There is nothing in this query for the
  // page to accidentally leak.
  const { data: stand } = await supabase
    .from("stands")
    .select("id, merchant_name")
    .eq("id", standId)
    .single();

  if (!stand) {
    notFound();
  }

  const { data: cardText } = await supabase
    .from("card_texts")
    .select("body")
    .eq("stand_id", standId)
    .maybeSingle();

  if (!cardText) {
    notFound();
  }

  return (
    <main className="flex flex-1 justify-center bg-neutral-50 px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-3.5 rounded-[10px] border-[1.5px] border-[#d8d3c4] bg-[#fffdf8] px-5 py-8 text-center shadow-[0_1px_0_rgba(0,0,0,0.02),0_8px_20px_-12px_rgba(20,22,26,0.25)]">
        <h1 className="max-w-[280px] text-2xl font-extrabold leading-snug text-[#16181c]">
          {CARD_HEADLINE}
        </h1>
        <p className="max-w-[270px] text-base leading-relaxed text-[#52565c]">
          {cardText.body}
        </p>
        <div className="h-0.5 w-12 rounded-full bg-[#0f7a4d]" />
        <p className="max-w-[260px] text-sm italic text-[#0b5c3a]">
          {CARD_UNIVERSAL_LINE}
        </p>
        <p className="mt-2 text-sm font-semibold text-[#16181c]">
          {stand.merchant_name}
        </p>
      </div>
    </main>
  );
}
