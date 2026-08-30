import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { signOut } from "@/app/setup/actions";
import { StandForm } from "@/app/setup/stand-form";

export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/setup");
  }

  return (
    <main className="flex flex-1 justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">
              Nuevo puesto
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Datos del comercio que estás visitando.
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="shrink-0 text-xs text-neutral-500 underline"
            >
              Salir
            </button>
          </form>
        </header>

        <StandForm />
      </div>
    </main>
  );
}
