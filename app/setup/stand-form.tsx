"use client";

import { useActionState, useState } from "react";
import { createStand, type StandFormState } from "@/app/setup/actions";
import {
  validateStandInput,
  type StandInput,
} from "@/app/lib/validation/stand";

const initialState: StandFormState = {
  values: { merchantName: "", standType: "", clabe: "" },
  errors: {},
};

type Touched = Partial<Record<keyof StandInput, boolean>>;

export function StandForm() {
  const [state, formAction, pending] = useActionState(
    createStand,
    initialState
  );
  const [values, setValues] = useState<StandInput>(state.values);
  const [touched, setTouched] = useState<Touched>({});

  const clientErrors = validateStandInput(values);

  function errorFor(field: keyof StandInput) {
    if (touched[field]) return clientErrors[field];
    return state.errors[field];
  }

  function updateField(field: keyof StandInput, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function touchField(field: keyof StandInput) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  return (
    <form
      action={formAction}
      onSubmit={() =>
        setTouched({ merchantName: true, standType: true, clabe: true })
      }
      className="flex flex-col gap-5"
      noValidate
    >
      <div>
        <label
          htmlFor="merchantName"
          className="block text-sm font-medium text-neutral-800"
        >
          Nombre del comercio
        </label>
        <input
          id="merchantName"
          name="merchantName"
          type="text"
          autoComplete="off"
          value={values.merchantName}
          onChange={(e) => updateField("merchantName", e.target.value)}
          onBlur={() => touchField("merchantName")}
          aria-invalid={Boolean(errorFor("merchantName"))}
          aria-describedby={
            errorFor("merchantName") ? "merchantName-error" : undefined
          }
          placeholder="Ej. Frutas y verduras Jesús"
          className={`mt-1 w-full rounded-lg border px-3 py-3 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black ${
            errorFor("merchantName") ? "border-red-500" : "border-neutral-300"
          }`}
        />
        {errorFor("merchantName") && (
          <p id="merchantName-error" className="mt-1 text-sm text-red-600">
            {errorFor("merchantName")}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="standType"
          className="block text-sm font-medium text-neutral-800"
        >
          Tipo de puesto
        </label>
        <input
          id="standType"
          name="standType"
          type="text"
          autoComplete="off"
          value={values.standType}
          onChange={(e) => updateField("standType", e.target.value)}
          onBlur={() => touchField("standType")}
          aria-invalid={Boolean(errorFor("standType"))}
          aria-describedby={
            errorFor("standType") ? "standType-error" : undefined
          }
          placeholder="Ej. Leche y maíz"
          className={`mt-1 w-full rounded-lg border px-3 py-3 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black ${
            errorFor("standType") ? "border-red-500" : "border-neutral-300"
          }`}
        />
        {errorFor("standType") && (
          <p id="standType-error" className="mt-1 text-sm text-red-600">
            {errorFor("standType")}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="clabe"
          className="block text-sm font-medium text-neutral-800"
        >
          CLABE
        </label>
        <input
          id="clabe"
          name="clabe"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={values.clabe}
          onChange={(e) => updateField("clabe", e.target.value)}
          onBlur={() => touchField("clabe")}
          aria-invalid={Boolean(errorFor("clabe"))}
          aria-describedby={errorFor("clabe") ? "clabe-error" : undefined}
          placeholder="18 dígitos"
          className={`mt-1 w-full rounded-lg border px-3 py-3 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black ${
            errorFor("clabe") ? "border-red-500" : "border-neutral-300"
          }`}
        />
        {errorFor("clabe") && (
          <p id="clabe-error" className="mt-1 text-sm text-red-600">
            {errorFor("clabe")}
          </p>
        )}
      </div>

      {state.formError && (
        <p className="text-sm text-red-600">{state.formError}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-lg bg-black py-3 text-base font-medium text-white disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Continuar"}
      </button>
    </form>
  );
}
