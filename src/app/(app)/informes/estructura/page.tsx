import { requerirSesion } from "@/lib/session";
import { AccionesInforme } from "@/components/AccionesInforme";
import { cargarEntrada } from "@/lib/datos-costos";
import { calcularEstructuras } from "@/lib/costos";
import { fmt, fmtPct } from "@/lib/formato";

export default async function Estructura() {
  const { empresa } = await requerirSesion();
  const entrada = await cargarEntrada(empresa);
  let filas: ReturnType<typeof calcularEstructuras> = [];
  let error: string | null = null;
  try {
    filas = calcularEstructuras(entrada);
  } catch (e) {
    error = (e as Error).message;
  }
  const produccionTotal = filas.reduce((a, f) => a + f.produccion, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Estructura de costos y precios</h1>
          <p className="text-sm text-ink-2">
            {empresa.razonSocial} · valores por unidad en {empresa.moneda}. Gastos ajenos {fmtPct(empresa.pctGastosAjenos)}, utilidad{" "}
            {fmtPct(empresa.pctUtilidad)}, IVA {fmtPct(empresa.pctIva)}.
          </p>
        </div>
        <AccionesInforme excel="/api/exportar/estructura" />
      </div>

      {error && <p role="alert" className="text-sm text-bad">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { t: "Indirectos mensuales", v: fmt(entrada.indirectos) },
          { t: "Depreciación mensual", v: fmt(entrada.depreciacion) },
          { t: "Nómina de administración", v: fmt(entrada.nominaAdministracion) },
          { t: "Pool indirecto a prorratear", v: fmt(entrada.indirectoMensual) },
          { t: "Nómina de producción", v: fmt(entrada.nominaProduccionMensual ?? 0) },
          { t: "Producción total (und)", v: fmt(produccionTotal, 0) },
        ].map((c) => (
          <div key={c.t} className="rounded-lg border border-line bg-surface p-3">
            <p className="text-xs text-ink-3">{c.t}</p>
            <p className="text-lg font-semibold tabular-nums text-ink">{c.v}</p>
          </div>
        ))}
      </section>
      {produccionTotal === 0 && filas.length > 0 && (
        <p className="text-sm text-warn">
          Ningún producto tiene producción mensual, así que no se puede repartir el costo indirecto. Indícala en
          cada producto.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[60rem] text-sm">
          <thead>
            <tr className="border-b border-line-strong text-right text-ink-2">
              <th className="py-2 text-left">Producto</th>
              <th>Mat. prima</th>
              <th>Insumos</th>
              <th>Mano de obra</th>
              <th>Directo</th>
              <th>Indirecto</th>
              <th>Costo total</th>
              <th>Gastos ajenos</th>
              <th>Utilidad</th>
              <th>Precio sin IVA</th>
              <th>IVA</th>
              <th>Precio final</th>
              <th>% prorrateo</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className="border-b border-line-soft text-right tabular-nums">
                <td className="whitespace-nowrap py-2 text-left">{f.codigo} · {f.nombre}</td>
                <td>{fmt(f.materiaPrima, 4)}</td>
                <td>{fmt(f.insumos, 4)}</td>
                <td>{fmt(f.manoObra, 4)}</td>
                <td>{fmt(f.directo, 4)}</td>
                <td>{fmt(f.indirecto, 4)}</td>
                <td className="font-medium">{fmt(f.costoTotal, 4)}</td>
                <td>{fmt(f.gastosAjenos, 4)}</td>
                <td>{fmt(f.utilidad, 4)}</td>
                <td>{fmt(f.precioSinIva, 4)}</td>
                <td>{fmt(f.iva, 4)}</td>
                <td className="font-semibold">{fmt(f.precio, 2)}</td>
                <td>{fmtPct(f.pctProrrateo)}</td>
              </tr>
            ))}
            {filas.length === 0 && !error && (
              <tr>
                <td colSpan={13} className="py-6 text-center text-ink-3">
                  Crea productos principales con receta para ver su estructura.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
