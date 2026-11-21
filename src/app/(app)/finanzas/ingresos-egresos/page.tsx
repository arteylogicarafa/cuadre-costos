import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/session";
import { aCalc } from "@/lib/datos-finanzas";
import { calcularVenta, periodoDeFecha, rangoPeriodo, ultimosPeriodos } from "@/lib/finanzas";
import { periodoActual } from "@/lib/nomina";
import { fmt } from "@/lib/formato";

export default async function IngresosEgresos() {
  const { empresa } = await requerirSesion();
  const periodos = ultimosPeriodos(periodoActual(), 12);
  const desde = rangoPeriodo(periodos[0]).desde;
  const hasta = rangoPeriodo(periodos[periodos.length - 1]).hasta;

  const [ventas, pagos] = await Promise.all([
    db.venta.findMany({ where: { empresaId: empresa.id, fecha: { gte: desde, lt: hasta } } }),
    db.pago.findMany({ where: { empresaId: empresa.id, fecha: { gte: desde, lt: hasta } } }),
  ]);

  const filas = periodos.map((p) => {
    const vs = ventas.filter((v) => periodoDeFecha(v.fecha) === p).map((v) => calcularVenta(aCalc(v)));
    const ingresos = vs.reduce((s, r) => s + r.base, 0);
    const costo = vs.reduce((s, r) => s + r.costoDirecto, 0);
    const gastos = pagos.filter((x) => periodoDeFecha(x.fecha) === p).reduce((s, x) => s + x.monto, 0);
    const egresos = costo + gastos;
    return { p, ingresos, egresos, saldo: ingresos - egresos };
  });
  const maximo = Math.max(...filas.flatMap((f) => [f.ingresos, f.egresos]), 1);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Ingresos vs egresos</h1>
        <p className="text-sm text-ink-2">
          Últimos 12 meses en {empresa.moneda}. Ingresos = ventas sin IVA. Egresos = costo directo de lo vendido
          más los pagos registrados.
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs text-ink-2">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-accent" /> Ingresos</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-ink-3" /> Egresos</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-left text-ink-2">
            <th className="py-2">Mes</th>
            <th className="w-1/2">Comparación</th>
            <th className="text-right">Ingresos</th>
            <th className="text-right">Egresos</th>
            <th className="text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.p} className="border-b border-line-soft">
              <td className="py-2">{f.p}</td>
              <td>
                <div className="flex flex-col gap-1" aria-hidden="true">
                  <div className="h-2 rounded-sm bg-accent" style={{ width: `${(f.ingresos / maximo) * 100}%` }} />
                  <div className="h-2 rounded-sm bg-ink-3" style={{ width: `${(f.egresos / maximo) * 100}%` }} />
                </div>
              </td>
              <td className="text-right tabular-nums">{fmt(f.ingresos)}</td>
              <td className="text-right tabular-nums">{fmt(f.egresos)}</td>
              <td className={`text-right tabular-nums ${f.saldo < 0 ? "text-bad" : ""}`}>{fmt(f.saldo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
