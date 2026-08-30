import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Pendiente",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function StandsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/stands");
  }

  // RLS (supplier_id = auth.uid()) is what actually scopes this to the
  // caller's own stands — there is no manual filter here to get wrong.
  const { data: stands } = await supabase
    .from("stands")
    .select("id, merchant_name, stand_type, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-1 justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <header className="mb-5 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-neutral-900">
            Mis puestos
          </h1>
          <Link
            href="/setup"
            className="text-sm font-semibold text-neutral-900 underline"
          >
            + Nuevo puesto
          </Link>
        </header>

        {!stands || stands.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Todavía no has visitado ningún puesto.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {stands.map((stand) => {
              const isConfirmed = stand.status === "confirmed";
              return (
                <li key={stand.id}>
                  <Link
                    href={`/setup/${stand.id}/tarjeta`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {stand.merchant_name}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {stand.stand_type} · {formatDate(stand.created_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isConfirmed
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {STATUS_LABEL[stand.status] ?? stand.status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
