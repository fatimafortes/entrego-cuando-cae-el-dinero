import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { signOut } from "@/app/setup/actions";

export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/setup");
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Nuevo puesto</h1>
      <p className="text-sm">Sesión iniciada como {user.email}.</p>
      <p className="text-sm text-neutral-500">
        El formulario de datos del comercio se agrega en F2.
      </p>
      <form action={signOut}>
        <button type="submit" className="text-sm underline">
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
