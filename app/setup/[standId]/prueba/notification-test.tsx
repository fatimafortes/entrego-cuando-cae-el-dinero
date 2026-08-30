"use client";

import { useRef, useState, useTransition } from "react";
import { finalizeStandStatus } from "@/app/setup/[standId]/prueba/actions";

const MAX_ATTEMPTS = 2;

type CheckPhase = "idle" | "checking" | "confirmed" | "retry" | "error";

export function NotificationTest({
  standId,
  merchantName,
  maskedClabe,
}: {
  standId: string;
  merchantName: string;
  maskedClabe: string;
}) {
  const [sent, setSent] = useState(false);
  const [phase, setPhase] = useState<CheckPhase>("idle");
  const [attempts, setAttempts] = useState(0);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setPhase("checking");

    const formData = new FormData();
    formData.append("image", file);

    let response: Response;
    try {
      response = await fetch("/api/notification-check", {
        method: "POST",
        body: formData,
      });
    } catch {
      setPhase("error");
      return;
    }

    if (!response.ok) {
      setPhase("error");
      return;
    }

    const result = (await response.json()) as {
      visible: boolean;
      reason: string;
    };

    if (result.visible) {
      setPhase("confirmed");
      startTransition(() => {
        finalizeStandStatus(standId, "confirmed");
      });
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (nextAttempts >= MAX_ATTEMPTS) {
      startTransition(() => {
        finalizeStandStatus(standId, "pending");
      });
      return;
    }

    setPhase("retry");
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
        <span aria-hidden>⚠</span>
        <span>Transferencia simulada. No se mueve dinero real.</span>
      </div>

      <div>
        <h1 className="text-lg font-semibold text-neutral-900">
          Prueba de notificación
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Confirma que la notificación del banco llega al teléfono del
          comercio.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Comercio
          </span>
          <span className="text-sm font-semibold text-neutral-900">
            {merchantName}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            CLABE
          </span>
          <span className="font-mono text-sm text-neutral-900">
            {maskedClabe}
          </span>
        </div>
      </div>

      {!sent && (
        <button
          type="button"
          onClick={() => setSent(true)}
          className="w-full rounded-lg bg-black py-3 text-base font-medium text-white"
        >
          Enviar 1 peso de prueba
        </button>
      )}

      {sent && (
        <>
          <p className="text-sm text-neutral-600">
            Transferencia de prueba enviada. Pide al comercio que revise su
            teléfono.
          </p>

          {phase !== "confirmed" && (
            <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-neutral-600">
              <span className="text-sm font-semibold text-neutral-800">
                {phase === "checking"
                  ? "Revisando la foto…"
                  : "Tome una foto de la pantalla de Jesús"}
              </span>
              <span className="text-xs text-neutral-500">
                La foto se usa una sola vez y no se guarda.
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onFileChange}
                disabled={phase === "checking"}
                className="sr-only"
              />
            </label>
          )}

          {phase === "retry" && (
            <p className="text-sm text-red-600">
              No se detectó la notificación. Ayuda al comercio a revisar que
              las notificaciones de su banco estén activadas e intenta de
              nuevo.
            </p>
          )}

          {phase === "error" && (
            <p className="text-sm text-red-600">
              No se pudo revisar la foto en este momento. Intenta de nuevo.
            </p>
          )}

          {phase === "confirmed" && (
            <div className="flex gap-3 rounded-xl border border-green-300 bg-green-50 p-3">
              <span aria-hidden className="text-green-700">
                ✓
              </span>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Sí llegó la notificación.
                </p>
                <p className="mt-0.5 text-xs text-green-700">
                  El teléfono del comercio mostró el aviso de depósito.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
