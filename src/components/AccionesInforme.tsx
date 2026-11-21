"use client";

/** Descargar a Excel y abrir el diálogo de impresión (desde ahí se guarda como PDF). Se oculta al imprimir. */
export function AccionesInforme({ excel }: { excel?: string }) {
  return (
    <div className="flex gap-2 text-sm print:hidden">
      {excel && (
        <a href={excel} className="rounded-md border border-line-strong px-3 py-2 hover:bg-hover">
          Descargar Excel
        </a>
      )}
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-md border border-line-strong px-3 py-2 hover:bg-hover"
      >
        Imprimir / guardar PDF
      </button>
    </div>
  );
}
