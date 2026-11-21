import { requerirSesion } from "@/lib/session";
import { AccionesInforme } from "@/components/AccionesInforme";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";
import { aCalc, pagosDelPeriodo, ventasDelPeriodo } from "@/lib/datos-finanzas";
import { calcularResultados } from "@/lib/finanzas";
import { periodoActual, periodoValido } from "@/lib/nomina";
import { CATEGORIAS_PAGO, fmt, fmtPct } from "@/lib/formato";

export default async function Resultados({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { empresa } = await requerirSesion();
  const sp = await searchParams;
  const periodo = periodoValido(sp.periodo) ? sp.periodo : periodoActual();
  const [ventas, pagos] = await Promise.all([
    ventasDelPeriodo(empresa.id, periodo),
    pagosDelPeriodo(empresa.id, periodo),
  ]);
  const gastos = pagos.reduce((s, p) => s + p.monto, 0);
  const r = calcularResultados(ventas.map(aCalc), gastos);
  const gastosPorCat = Object.entries(CATEGORIAS_PAGO)
    .map(([k, n]) => ({ n, m: pagos.filter((p) => p.categoria === k).reduce((s, p) => s + p.monto, 0) }))
    .filter((c) => c.m > 0);

  const fila = (t: string, v: number, opts?: { fuerte?: boolean; sangria?: boolean; pct?: number }) => (
    <tr className={`border-b border-line-soft ${opts?.fuerte ? "font-semibold" : ""}`}>
      <td className={`py-2 ${opts?.sangria ? "pl-6 text-ink-2" : ""}`}>{t}</td>
      <td className={`text-right tabular-nums ${v < 0 ? "text-bad" : ""}`}>{fmt(v)}</td>
      <td className="text-right tabular-nums text-ink-3">{opts?.pct !== undefined ? fmtPct(opts.pct) : ""}</td>
    </tr>
  );

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Estado de resultados</h1>
          <p className="text-sm text-ink-2">{empresa.razonSocial} · período {periodo} · {empresa.moneda}</p>
        </div>
        <div className="flex flex-wrap items-end gap-4 print:hidden">
          <SelectorPeriodo periodo={periodo} />
          <AccionesInforme />
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-ink-2">
            <th className="py-2 text-left font-medium">Concepto</th>
            <th className="text-right font-medium">Monto</th>
            <th className="text-right font-medium">% de ingresos</th>
          </tr>
        </thead>
        <tbody>
          {fila("Ingresos por ventas (base imponible)", r.ingresos, { fuerte: true })}
          {fila("Costo de ventas (costos directos)", -r.costoVentas)}
          {fila("Utilidad bruta", r.utilidadBruta, { fuerte: true, pct: r.margenBruto })}
          {gastosPorCat.map((c) => fila(c.n, -c.m, { sangria: true }))}
          {fila("Gastos del período", -r.gastos)}
          {fila("Utilidad neta", r.utilidadNeta, { fuerte: true, pct: r.margenNeto })}
        </tbody>
      </table>

      <p className="max-w-prose text-xs text-ink-3">
        El costo de ventas lleva solo los costos directos de lo vendido (materia prima, insumos y mano de obra de
        producción), según el costo guardado en cada venta. Los costos indirectos y la nómina de administración
        entran como gastos cuando se registran en Pagos. Esto no reemplaza la contabilidad: es una vista
        gerencial. El IVA no forma parte de los ingresos.
      </p>
    </div>
  );
}
