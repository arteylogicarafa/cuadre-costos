import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/session";
import { AccionesInforme } from "@/components/AccionesInforme";
import { Formulario, Campo } from "@/components/Formulario";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";
import { registrarVenta, borrarVenta } from "@/lib/acciones-finanzas";
import { aCalc, ventasDelPeriodo } from "@/lib/datos-finanzas";
import { calcularVenta, resumirPorProducto } from "@/lib/finanzas";
import { periodoActual, periodoValido } from "@/lib/nomina";
import { fmt, fmtFecha, fmtPct } from "@/lib/formato";

export default async function Ventas({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { empresa, rol } = await requerirSesion();
  const sp = await searchParams;
  const periodo = periodoValido(sp.periodo) ? sp.periodo : periodoActual();
  const [ventas, productos] = await Promise.all([
    ventasDelPeriodo(empresa.id, periodo),
    db.producto.findMany({ where: { empresaId: empresa.id, tipo: "PRINCIPAL" }, orderBy: { nombre: "asc" } }),
  ]);
  const edita = rol !== "CONSULTA";
  const resumen = resumirPorProducto(
    ventas.map((v) => ({ productoId: v.productoId, nombre: v.producto.nombre, venta: aCalc(v) })),
  );
  const tot = resumen.reduce(
    (a, f) => ({ base: a.base + f.base, iva: a.iva + f.iva, total: a.total + f.total, costo: a.costo + f.costoTotal, ut: a.ut + f.utilidad }),
    { base: 0, iva: 0, total: 0, costo: 0, ut: 0 },
  );

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Ventas</h1>
          <p className="text-sm text-ink-2">
            Período {periodo}. El costo de cada venta se guarda al registrarla, así que cambiar una receta
            después no altera las ventas pasadas.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4 print:hidden">
          <SelectorPeriodo periodo={periodo} />
          <AccionesInforme excel={`/api/exportar/ventas?periodo=${periodo}`} />
        </div>
      </div>

      {edita && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-ink">Registrar venta</h2>
          {productos.length === 0 ? (
            <p className="text-sm text-ink-2">Crea primero un producto principal con receta.</p>
          ) : (
            <Formulario accion={registrarVenta} boton="Registrar" limpiar className="grid items-end gap-4 sm:grid-cols-3">
              <Campo nombre="fecha" etiqueta="Fecha" tipo="date" valor={`${periodo}-01`} />
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-2">Producto</span>
                <select name="productoId" required className="rounded-md border border-line-strong bg-field px-3 py-2">
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </label>
              <Campo nombre="cantidad" etiqueta="Cantidad" tipo="number" paso="any" />
              <Campo nombre="precioUnitario" etiqueta="Precio sin IVA (vacío = el calculado)" tipo="number" paso="any" requerido={false} />
              <Campo nombre="descuento" etiqueta="Descuento total" tipo="number" paso="any" valor={0} />
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input type="checkbox" name="exento" /> Exento de IVA
              </label>
            </Formulario>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Relación de ventas por producto</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead>
              <tr className="border-b border-line-strong text-right text-ink-2">
                <th className="py-2 text-left">Producto</th>
                <th>Cantidad</th>
                <th>Base imponible</th>
                <th>IVA</th>
                <th>Total</th>
                <th>Costo</th>
                <th>Utilidad</th>
                <th>% utilidad</th>
              </tr>
            </thead>
            <tbody>
              {resumen.map((f) => (
                <tr key={f.productoId} className="border-b border-line-soft text-right tabular-nums">
                  <td className="py-2 text-left">{f.nombre}</td>
                  <td>{fmt(f.cantidad, 0)}</td>
                  <td>{fmt(f.base)}</td>
                  <td>{fmt(f.iva)}</td>
                  <td>{fmt(f.total)}</td>
                  <td>{fmt(f.costoTotal)}</td>
                  <td>{fmt(f.utilidad)}</td>
                  <td>{fmtPct(f.pctUtilidad)}</td>
                </tr>
              ))}
              {resumen.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-ink-3">No hay ventas en este período.</td></tr>
              )}
              {resumen.length > 0 && (
                <tr className="font-semibold tabular-nums text-right">
                  <td className="py-2 text-left">Total</td>
                  <td />
                  <td>{fmt(tot.base)}</td>
                  <td>{fmt(tot.iva)}</td>
                  <td>{fmt(tot.total)}</td>
                  <td>{fmt(tot.costo)}</td>
                  <td>{fmt(tot.ut)}</td>
                  <td>{fmtPct(tot.costo > 0 ? tot.ut / tot.costo : 0)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Detalle</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong text-right text-ink-2">
              <th className="py-2 text-left">Fecha</th>
              <th className="text-left">Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total con IVA</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id} className="border-b border-line-soft text-right tabular-nums">
                <td className="py-2 text-left">{fmtFecha(v.fecha)}</td>
                <td className="text-left">{v.producto.nombre}{v.exento ? " (exento)" : ""}</td>
                <td>{fmt(v.cantidad, 0)}</td>
                <td>{fmt(v.precioUnitario, 4)}</td>
                <td>{fmt(calcularVenta(aCalc(v)).total)}</td>
                <td>
                  {edita && (
                    <form action={borrarVenta}>
                      <input type="hidden" name="id" value={v.id} />
                      <button className="text-bad underline">Borrar</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
