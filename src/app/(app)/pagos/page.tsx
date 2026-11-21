import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/session";
import { Formulario, Campo } from "@/components/Formulario";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";
import { registrarPago, borrarPago } from "@/lib/acciones-finanzas";
import { pagosDelPeriodo } from "@/lib/datos-finanzas";
import { periodoActual, periodoValido } from "@/lib/nomina";
import { CATEGORIAS_PAGO, fmt, fmtFecha } from "@/lib/formato";

const MEDIOS = { EFECTIVO: "Efectivo", TRANSFERENCIA: "Transferencia", OTRO: "Otro" } as const;

export default async function Pagos({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { empresa, rol } = await requerirSesion();
  const sp = await searchParams;
  const periodo = periodoValido(sp.periodo) ? sp.periodo : periodoActual();
  const [pagos, indirectos] = await Promise.all([
    pagosDelPeriodo(empresa.id, periodo),
    db.costoIndirecto.findMany({ where: { empresaId: empresa.id }, orderBy: { descripcion: "asc" } }),
  ]);
  const edita = rol !== "CONSULTA";
  const total = pagos.reduce((s, p) => s + p.monto, 0);
  const porCategoria = Object.entries(CATEGORIAS_PAGO)
    .map(([k, nombre]) => ({ nombre, monto: pagos.filter((p) => p.categoria === k).reduce((s, p) => s + p.monto, 0) }))
    .filter((c) => c.monto > 0);

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Pagos y gastos</h1>
          <p className="text-sm text-ink-2">
            Período {periodo}. Registra lo que se paga de servicios, permisos, alquileres y administración.
            Estos pagos son los gastos del estado de resultados.
          </p>
        </div>
        <SelectorPeriodo periodo={periodo} />
      </div>

      {edita && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-ink">Registrar pago</h2>
          <Formulario accion={registrarPago} boton="Registrar" limpiar className="grid items-end gap-4 sm:grid-cols-3">
            <Campo nombre="fecha" etiqueta="Fecha" tipo="date" valor={`${periodo}-01`} />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-2">Categoría</span>
              <select name="categoria" className="rounded-md border border-line-strong bg-field px-3 py-2">
                {Object.entries(CATEGORIAS_PAGO).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <Campo nombre="concepto" etiqueta="Concepto" />
            <Campo nombre="monto" etiqueta={`Monto (${empresa.moneda})`} tipo="number" paso="any" />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-2">Medio de pago</span>
              <select name="medio" className="rounded-md border border-line-strong bg-field px-3 py-2">
                {Object.entries(MEDIOS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <Campo nombre="comprobante" etiqueta="Comprobante o referencia" requerido={false} />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-2">Corresponde al costo indirecto (opcional)</span>
              <select name="indirectoId" className="rounded-md border border-line-strong bg-field px-3 py-2">
                <option value="">— ninguno —</option>
                {indirectos.map((i) => (
                  <option key={i.id} value={i.id}>{i.descripcion}</option>
                ))}
              </select>
            </label>
          </Formulario>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs text-ink-3">Total pagado</p>
          <p className="text-lg font-semibold tabular-nums">{fmt(total)}</p>
        </div>
        {porCategoria.map((c) => (
          <div key={c.nombre} className="rounded-lg border border-line bg-surface p-3">
            <p className="text-xs text-ink-3">{c.nombre}</p>
            <p className="text-lg font-semibold tabular-nums">{fmt(c.monto)}</p>
          </div>
        ))}
      </section>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-left text-ink-2">
            <th className="py-2">Fecha</th>
            <th>Categoría</th>
            <th>Concepto</th>
            <th>Medio</th>
            <th>Referencia</th>
            <th className="text-right">Monto</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {pagos.map((p) => (
            <tr key={p.id} className="border-b border-line-soft">
              <td className="py-2">{fmtFecha(p.fecha)}</td>
              <td>{CATEGORIAS_PAGO[p.categoria as keyof typeof CATEGORIAS_PAGO] ?? p.categoria}</td>
              <td>{p.concepto}{p.indirecto ? ` · ${p.indirecto.descripcion}` : ""}</td>
              <td>{MEDIOS[p.medio as keyof typeof MEDIOS] ?? p.medio}</td>
              <td>{p.comprobante ?? ""}</td>
              <td className="text-right tabular-nums">{fmt(p.monto)}</td>
              <td className="text-right">
                {edita && (
                  <form action={borrarPago}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-bad underline">Borrar</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          {pagos.length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-ink-3">No hay pagos en este período.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
