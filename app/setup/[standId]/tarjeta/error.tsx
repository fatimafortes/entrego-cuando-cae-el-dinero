"use client";

export default function CardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <p className="text-sm text-red-600">
        No se pudo generar o cargar la tarjeta. Intenta de nuevo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Reintentar
      </button>
    </main>
  );
}
