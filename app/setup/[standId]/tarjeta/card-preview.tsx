"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function CardPreview({
  headline,
  body,
  universalLine,
  merchantName,
  standType,
  ruleUrl,
}: {
  headline: string;
  body: string;
  universalLine: string;
  merchantName: string;
  standType: string;
  ruleUrl: string;
}) {
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">(
    "idle"
  );

  async function handleSend() {
    const shareText = `${headline}\n\n${body}\n\n${universalLine}\n${ruleUrl}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: shareText, url: ruleUrl });
      } catch {
        // user cancelled the native share sheet; nothing to report
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      setShareStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 print:hidden">
        Vista previa de impresión
      </p>

      <div
        id="printable-card"
        className="relative flex flex-col items-center gap-3.5 rounded-[10px] border-[1.5px] border-[#d8d3c4] bg-[#fffdf8] px-5 py-6 text-center shadow-[0_1px_0_rgba(0,0,0,0.02),0_8px_20px_-12px_rgba(20,22,26,0.25)] before:pointer-events-none before:absolute before:inset-2 before:rounded-md before:border before:border-dashed before:border-[#d8d3c4] before:content-[''] print:shadow-none"
      >
        <h2 className="max-w-[260px] text-[21px] font-extrabold leading-snug text-[#16181c]">
          {headline}
        </h2>
        <p className="max-w-[250px] text-[14.5px] leading-relaxed text-[#52565c]">
          {body}
        </p>
        <div className="h-0.5 w-12 rounded-full bg-[#0f7a4d]" />
        <p className="max-w-[240px] text-[13px] italic text-[#0b5c3a]">
          {universalLine}
        </p>
        <QRCodeSVG
          value={ruleUrl}
          size={92}
          fgColor="#16181c"
          bgColor="#fffdf8"
        />
        <div>
          <p className="text-[14.5px] font-semibold text-[#16181c]">
            {merchantName}
          </p>
          <p className="text-[12.5px] text-[#8a8f98]">{standType}</p>
        </div>
      </div>

      <div className="flex gap-3 print:hidden">
        <button
          type="button"
          onClick={handleSend}
          className="flex-1 rounded-lg border border-neutral-300 bg-white py-3 text-sm font-semibold text-neutral-900"
        >
          {shareStatus === "copied" ? "Copiado" : "Enviar al teléfono"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 rounded-lg bg-black py-3 text-sm font-semibold text-white"
        >
          Imprimir
        </button>
      </div>

      {shareStatus === "error" && (
        <p className="text-sm text-red-600 print:hidden">
          No se pudo compartir ni copiar. Copia el texto manualmente.
        </p>
      )}
    </div>
  );
}
