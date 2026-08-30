import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { getOrCreateCardBody } from "@/app/lib/cards/get-or-create-card-body";
import { getBaseUrl } from "@/app/lib/url";
import { CARD_HEADLINE, CARD_UNIVERSAL_LINE } from "@/app/lib/card-copy";
import { CardPreview } from "@/app/setup/[standId]/tarjeta/card-preview";

export default async function CardPage({
  params,
}: PageProps<"/setup/[standId]/tarjeta">) {
  const { standId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/setup/${standId}/tarjeta`);
  }

  const { data: stand } = await supabase
    .from("stands")
    .select("id, merchant_name, stand_type")
    .eq("id", standId)
    .single();

  if (!stand) {
    redirect("/setup");
  }

  const body = await getOrCreateCardBody(supabase, stand.id, stand.stand_type);
  const baseUrl = await getBaseUrl();
  const ruleUrl = `${baseUrl}/regla/${stand.id}`;

  return (
    <main className="flex flex-1 justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-neutral-900">
            Tarjeta generada
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Esto es lo que se imprime y se pega en el puesto.
          </p>
        </div>

        <CardPreview
          headline={CARD_HEADLINE}
          body={body}
          universalLine={CARD_UNIVERSAL_LINE}
          merchantName={stand.merchant_name}
          standType={stand.stand_type}
          ruleUrl={ruleUrl}
        />
      </div>
    </main>
  );
}
