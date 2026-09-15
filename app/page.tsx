import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-xl font-semibold">Entrego cuando cae el dinero</h1>
      <p className="text-sm text-center max-w-xs">
        Registra puestos y confirma entregas solo cuando el pago ya cayó.
      </p>
      <Link
        href="/setup"
        className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium"
      >
        Entrar
      </Link>
    </main>
  );
}
