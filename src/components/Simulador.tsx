"use client";
import { useState } from "react";
import { simularCombo } from "@/lib/costos";
import { fmt, fmtPct } from "@/lib/formato";

type Producto = { id: string; nombre: string; precioSinIva: number; costoTotal: number };
type Fila = { clave: number; productoId: string; cantidad: number };

export function Simulador({ productos, pctIva, moneda }: { productos: Producto[]; pctIva: number; moneda: string }) {
  const [filas, setFilas] = useState<Fila[]>([{ clave: 1, productoId: productos[0]?.id ?? "", cantidad: 1 }]);
  const [descuento, setDescuento] = useState(10);
  const [siguiente, setSiguiente] = useState(2);

  if (productos.length === 0)
    return <p className="text-sm text-ink-2">Crea productos principales con receta para simular combos.</p>;

  const items = filas.flatMap((f) => {
    const p = productos.find((x) => x.id === f.productoId);
    return p && f.cantidad > 0 ? [{ precioSinIva: p.precioSinIva, costoTotal: p.costoTotal, cantidad: f.cantidad }] : [];
  });
  const r = simularCombo(items, descuento / 100, pctIva);

  const cambiar = (clave: number, parte: Partial<Fila>) =>
    setFilas((fs) => fs.map((f) => (f.clave === clave ? { ...f, ...parte } : f)));

  const resultados: [string, string][] = [
    ["Costo del combo", fmt(r.costo)],
    ["Precio de lista (suma)", fmt(r.precioLista)],
    [`Descuento (${descuento} %)`, `− ${fmt(r.descuento)}`],
    ["Precio sin IVA", fmt(r.precioSinIva)],
    ["IVA", fmt(r.iva)],
    ["Precio final", fmt(r.precioFinal)],
    ["Utilidad", fmt(r.utilidad)],
    ["Margen sobre el precio", fmtPct(r.margen)],
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Productos del combo</h2>
        {filas.map((f) => (
          <div key={f.clave} className="flex items-end gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-ink-2">Producto</span>
              <select
                value={f.productoId}
                onChange={(e) => cambiar(f.clave, { productoId: e.target.value })}
                className="rounded-md border border-line-strong bg-field px-3 py-2"
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} ({fmt(p.precioSinIva)})</option>
                ))}
              </select>
            </label>
            <label className="flex w-24 flex-col gap-1 text-sm">
              <span className="text-ink-2">Cantidad</span>
              <input
                type="number"
                min="1"
                step="1"
                value={f.cantidad}
                onChange={(e) => cambiar(f.clave, { cantidad: Number(e.target.value) })}
                className="rounded-md border border-line-strong bg-field px-3 py-2"
              />
            </label>
            <button
              type="button"
              disabled={filas.length === 1}
              onClick={() => setFilas((fs) => fs.filter((x) => x.clave !== f.clave))}
              className="pb-2 text-sm text-bad underline disabled:opacity-30"
            >
              Quitar
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            onClick={() => {
              setFilas((fs) => [...fs, { clave: siguiente, productoId: productos[0].id, cantidad: 1 }]);
              setSiguiente((n) => n + 1);
            }}
            className="rounded-md border border-line-strong px-3 py-2 text-sm hover:bg-hover"
          >
            + Agregar producto
          </button>
        </div>
        <label className="mt-2 flex w-40 flex-col gap-1 text-sm">
          <span className="text-ink-2">Descuento del combo (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="any"
            value={descuento}
            onChange={(e) => setDescuento(Number(e.target.value))}
            className="rounded-md border border-line-strong bg-field px-3 py-2"
          />
        </label>
      </section>

      <section aria-live="polite" className="rounded-lg border border-line bg-surface p-4">
        <h2 className="mb-2 font-semibold text-ink">Resultado ({moneda})</h2>
        <dl className="flex flex-col gap-1 text-sm">
          {resultados.map(([t, v]) => (
            <div key={t} className="flex justify-between border-b border-line-soft py-1">
              <dt className="text-ink-2">{t}</dt>
              <dd className="tabular-nums font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {r.pierde && (
          <p role="alert" className="mt-3 text-sm text-bad">
            Con este descuento el precio queda por debajo del costo: el combo pierde dinero.
          </p>
        )}
      </section>
    </div>
  );
}
