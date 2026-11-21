import Link from "next/link";
import { requerirNomina } from "@/lib/session";
import { AccionesInforme } from "@/components/AccionesInforme";
import { nominaDelPeriodo } from "@/lib/datos-nomina";
import { guardarNovedad } from "@/lib/acciones-nomina";
import { periodoActual, periodoValido } from "@/lib/nomina";
import { fmt } from "@/lib/formato";

export default async function Calculo({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { empresa } = await requerirNomina();
  const sp = await searchParams;
  const periodo = periodoValido(sp.periodo) ? sp.periodo : periodoActual();
  const n = await nominaDelPeriodo(empresa.id, periodo);

  const suma = (f: (r: (typeof n.filas)[number]["r"]) => number) => n.filas.reduce((s, x) => s + f(x.r), 0);
  const totales = [
    { t: "Sueldos y bonos pagados", v: suma((r) => r.salario + r.bonoNocturno + r.horasExtras + r.feriados + r.bonos + r.alimentacion + r.comision) },
    { t: "Alícuotas (utilidades y bono vac.)", v: suma((r) => r.alicuotaUtilidades + r.alicuotaBonoVacacional) },
    { t: "Aportes patronales", v: suma((r) => r.ivssPatrono + r.rpePatrono + r.faovPatrono + r.incesPatrono) },
    { t: "Costo total para la empresa", v: suma((r) => r.costoEmpresa) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Cálculo de nómina</h1>
          <p className="text-sm text-ink-2">
            Período {periodo} · {n.lunes} lunes · valores en {empresa.moneda}
          </p>
        </div>
        <AccionesInforme excel={`/api/exportar/nomina?periodo=${periodo}`} />
        <form className="flex items-end gap-2 text-sm print:hidden">
          <label className="flex flex-col gap-1">
            <span className="text-ink-2">Período</span>
            <input
              type="month"
              name="periodo"
              defaultValue={periodo}
              className="rounded-md border border-line-strong bg-field px-3 py-2"
            />
          </label>
          <button className="rounded-md border border-line-strong px-3 py-2 hover:bg-hover">Ver</button>
        </form>
      </div>

      {n.usaDefecto && (
        <p className="text-sm text-warn">
          No hay parámetros vigentes para este período: se usan los valores por defecto.{" "}
          <Link href="/nomina/parametros" className="underline">Configurarlos</Link>
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-4">
        {totales.map((c) => (
          <div key={c.t} className="rounded-lg border border-line bg-surface p-3">
            <p className="text-xs text-ink-3">{c.t}</p>
            <p className="text-lg font-semibold tabular-nums text-ink">{fmt(c.v)}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs text-ink-3">Producción (pasa a mano de obra del costeo)</p>
          <p className="text-lg font-semibold tabular-nums">{fmt(n.costoProduccion)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs text-ink-3">Administración (pasa a costos indirectos)</p>
          <p className="text-lg font-semibold tabular-nums">{fmt(n.costoAdministracion)}</p>
        </div>
      </section>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[64rem] text-sm">
          <thead>
            <tr className="border-b border-line-strong text-right text-ink-2">
              <th className="py-2 text-left">Empleado</th>
              <th>H. noct.</th>
              <th>H. extras</th>
              <th>Feriados</th>
              <th />
              <th>Salario</th>
              <th>Adicionales</th>
              <th>Retenciones</th>
              <th>Neto a cobrar</th>
              <th>Salario integral</th>
              <th>Costo empresa</th>
            </tr>
          </thead>
          <tbody>
            {n.filas.map((f) => {
              const adic = f.r.bonoNocturno + f.r.horasExtras + f.r.feriados + f.r.bonos + f.r.alimentacion + f.r.comision;
              const ret = f.r.ivssTrab + f.r.rpeTrab + f.r.faovTrab + f.r.incesTrab;
              const fid = `nov-${f.empleado.id}`;
              return (
                <tr key={f.empleado.id} className="border-b border-line-soft text-right tabular-nums">
                  <td className="py-2 text-left">
                    {f.empleado.nombre}
                    <span className="block text-xs text-ink-3">{f.empleado.cargo}</span>
                  </td>
                  {(["horasNocturnas", "horasExtras", "diasFeriados"] as const).map((k) => (
                    <td key={k}>
                      <input
                        form={fid}
                        name={k}
                        type="number"
                        step="any"
                        min="0"
                        defaultValue={f.novedad[k]}
                        aria-label={k}
                        className="w-16 rounded border border-line-strong px-1 py-1 text-right"
                      />
                    </td>
                  ))}
                  <td>
                    <form id={fid} action={guardarNovedad}>
                      <input type="hidden" name="empleadoId" value={f.empleado.id} />
                      <input type="hidden" name="periodo" value={periodo} />
                      <button className="text-accent-ink underline">Guardar</button>
                    </form>
                  </td>
                  <td>{fmt(f.r.salario)}</td>
                  <td>{fmt(adic)}</td>
                  <td>{fmt(ret)}</td>
                  <td className="font-semibold">{fmt(f.r.neto)}</td>
                  <td>{fmt(f.r.salarioIntegral)}</td>
                  <td className="font-medium">{fmt(f.r.costoEmpresa)}</td>
                </tr>
              );
            })}
            {n.filas.length === 0 && (
              <tr>
                <td colSpan={11} className="py-6 text-center text-ink-3">
                  No hay empleados activos. Agrégalos en Cargos y empleados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="max-w-prose text-xs text-ink-3">
        Adicionales = recargos, bonos, alimentación y comisiones. Retenciones = IVSS, RPE, FAOV e INCES del
        trabajador. El costo de la empresa incluye además las alícuotas de utilidades y bono vacacional y los
        aportes patronales.
      </p>
    </div>
  );
}
