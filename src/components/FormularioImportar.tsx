"use client";
import { useActionState } from "react";
import { importarMateriasPrimas, type EstadoImport } from "@/lib/acciones-importar";

export function FormularioImportar() {
  const [estado, enviar, pendiente] = useActionState<EstadoImport, FormData>(importarMateriasPrimas, undefined);
  const r = estado?.resumen;
  return (
    <div className="flex flex-col gap-4">
      <form action={enviar} className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-2">Archivo Excel (.xlsx, máximo 5 MB)</span>
          <input
            type="file"
            name="archivo"
            accept=".xlsx"
            required
            className="rounded-md border border-line-strong bg-field px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="simulacion" defaultChecked /> Solo revisar (no guardar)
        </label>
        <button
          disabled={pendiente}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-strong disabled:opacity-50"
        >
          {pendiente ? "Leyendo…" : "Revisar o importar"}
        </button>
      </form>

      {estado?.error && (
        <p role="alert" className="text-sm text-bad">{estado.error}</p>
      )}

      {r && (
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 text-sm" role="status">
          <p className="font-semibold text-ink">
            {r.simulacion
              ? `Revisión de la hoja "${r.hoja}": ${r.importadas} materias primas se podrían importar. No se guardó nada.`
              : `Se importaron ${r.importadas} materias primas de la hoja "${r.hoja}".`}
          </p>
          {r.unidadesCreadas.length > 0 && (
            <p className="text-ink-2">
              {r.simulacion ? "Se crearían" : "Se crearon"} unidades nuevas: {r.unidadesCreadas.join(", ")}.
            </p>
          )}
          {r.avisos.length > 0 && (
            <div>
              <p className="font-medium text-warn">Revisa estos datos ({r.avisos.length}):</p>
              <ul className="list-disc pl-5 text-ink-2">
                {r.avisos.map((a, i) => (
                  <li key={i}>Fila {a.fila}: {a.texto}</li>
                ))}
              </ul>
            </div>
          )}
          {r.omitidas.length > 0 && (
            <details>
              <summary className="cursor-pointer font-medium text-ink">
                Filas omitidas ({r.omitidas.length})
              </summary>
              <ul className="mt-1 list-disc pl-5 text-ink-2">
                {r.omitidas.map((o, i) => (
                  <li key={i}>Fila {o.fila}: {o.motivo}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
