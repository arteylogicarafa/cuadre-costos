"use client";
import { useActionState, useRef, type ReactNode } from "react";
import type { Estado } from "@/lib/acciones-auth";

/** Formulario con mensaje de error y botón que se desactiva mientras guarda. */
export function Formulario({
  accion,
  children,
  boton,
  limpiar = false,
  className = "",
}: {
  accion: (e: Estado, fd: FormData) => Promise<Estado>;
  children: ReactNode;
  boton: string;
  limpiar?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [estado, enviar, pendiente] = useActionState(
    async (e: Estado, fd: FormData) => {
      const r = await accion(e, fd);
      if (limpiar && !r?.error) ref.current?.reset();
      return r;
    },
    undefined,
  );
  return (
    <form ref={ref} action={enviar} className={className}>
      {children}
      {estado?.error && (
        <p role="alert" className="text-sm text-bad col-span-full">
          {estado.error}
        </p>
      )}
      <button
        disabled={pendiente}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-strong disabled:opacity-50"
      >
        {pendiente ? "Guardando…" : boton}
      </button>
    </form>
  );
}

export function Campo({
  nombre,
  etiqueta,
  tipo = "text",
  requerido = true,
  valor,
  paso,
}: {
  nombre: string;
  etiqueta: string;
  tipo?: string;
  requerido?: boolean;
  valor?: string | number;
  paso?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-ink-2">{etiqueta}</span>
      <input
        name={nombre}
        type={tipo}
        required={requerido}
        defaultValue={valor}
        step={paso}
        className="rounded-md border border-line-strong bg-field px-3 py-2 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </label>
  );
}
