import { signInWithGoogle } from "@/app/login/actions";

export default async function LoginPage(props: PageProps<"/login">) {
  const { next, error } = await props.searchParams;
  const nextPath = Array.isArray(next) ? next[0] : next;
  const hasError = Array.isArray(error) ? error.length > 0 : Boolean(error);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-xl font-semibold">Entrego cuando cae el dinero</h1>
      <p className="text-sm text-center max-w-xs">
        Acceso para proveedores. Inicia sesión con Google para visitar puestos.
      </p>
      {hasError && (
        <p className="text-sm text-red-600">
          No se pudo iniciar sesión. Intenta de nuevo.
        </p>
      )}
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={nextPath ?? "/setup"} />
        <button
          type="submit"
          className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium"
        >
          Iniciar sesión con Google
        </button>
      </form>
    </main>
  );
}
