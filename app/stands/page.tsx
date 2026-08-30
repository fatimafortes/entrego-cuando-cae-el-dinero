import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

export default async function StandsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/stands");
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Mis puestos</h1>
      <p className="text-sm text-neutral-500">
        La lista de puestos visitados se agrega en F5.
      </p>
    </main>
  );
}
