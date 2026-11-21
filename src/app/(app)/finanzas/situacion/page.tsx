import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/session";
import { Formulario } from "@/components/Formulario";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";
import { crearCuenta, borrarCuenta, guardarSaldo } from "@/lib/acciones-finanzas";
import { calcularSituacion } from "@/lib/finanzas";
import { periodoActual, periodoValido } from "@/lib/nomina";
import { fmt } from "@/lib/formato";

const TIPOS = { ACTIVO: "Activos", PASIVO: "Pasivos", PATRIMONIO: "Patrimonio" } as const;

export default async function Situacion({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { empresa, rol } = await requerirSesion();
  const sp = await searchParams;
  const periodo = periodoValido(sp.periodo) ? sp.periodo : periodoActual();
  const cuentas = await db.cuentaContable.findMany({
    where: { empresaId: empresa.id },
    orderBy: { nombre: "asc" },
    include: { saldos: { where: { periodo } } },
  });
  const edita = rol !== "CONSULTA";
  const filas = cuentas.map((c) => ({ ...c, monto: c.saldos[0]?.monto ?? 0 }));
  const s = calcularSituacion(filas);
  const totalDe = { ACTIVO: s.activos, PASIVO: s.pasivos, PATRIMONIO: s.patrimonio };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Estado de situación</h1>
          <p className="text-sm text-ink-2">
            {empresa.razonSocial} · al cierre de {periodo} · {empresa.moneda}. Los saldos se cargan a mano.
          </p>
        </div>
        <SelectorPeriodo periodo={periodo} />
      </div>

      {edita && (
        <Formulario accion={crearCuenta} boton="Agregar cuenta" limpiar className="grid items-end gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-2">Nombre de la cuenta</span>
            <input name="nombre" required className="rounded-md border border-line-strong bg-field px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-2">Tipo</span>
            <select name="tipo" className="rounded-md border border-line-strong bg-field px-3 py-2">
              {Object.entries(TIPOS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
        </Formulario>
      )}

      {(Object.keys(TIPOS) as (keyof typeof TIPOS)[]).map((tipo) => (
        <section key={tipo}>
          <h2 className="mb-1 font-semibold text-ink">{TIPOS[tipo]}</h2>
          <table className="w-full text-sm">
            <tbody>
              {filas.filter((c) => c.tipo === tipo).map((c) => {
                const fid = `saldo-${c.id}`;
                return (
                  <tr key={c.id} className="border-b border-line-soft">
                    <td className="py-2">{c.nombre}</td>
                    <td className="w-40 text-right">
                      {edita ? (
                        <input
                          form={fid}
                          name="monto"
                          type="number"
                          step="any"
                          defaultValue={c.monto}
                          aria-label={`Saldo de ${c.nombre}`}
                          className="w-36 rounded border border-line-strong px-2 py-1 text-right tabular-nums"
                        />
                      ) : (
                        <span className="tabular-nums">{fmt(c.monto)}</span>
                      )}
                    </td>
                    {edita && (
                      <td className="w-28 text-right">
                        <form id={fid} action={guardarSaldo} className="inline">
                          <input type="hidden" name="cuentaId" value={c.id} />
                          <input type="hidden" name="periodo" value={periodo} />
                          <button className="text-accent-ink underline">Guardar</button>
                        </form>{" "}
                        <form action={borrarCuenta} className="inline">
                          <input type="hidden" name="id" value={c.id} />
                          <button className="ml-2 text-bad" aria-label={`Borrar ${c.nombre}`}>×</button>
                        </form>
                      </td>
                    )}
                  </tr>
                );
              })}
              <tr className="font-semibold">
                <td className="py-2">Total {TIPOS[tipo].toLowerCase()}</td>
                <td className="text-right tabular-nums">{fmt(totalDe[tipo])}</td>
                {edita && <td />}
              </tr>
            </tbody>
          </table>
        </section>
      ))}

      <section
        className={`rounded-lg border p-4 text-sm ${s.cuadra ? "border-accent text-accent-ink" : "border-warn text-warn"}`}
        role="status"
      >
        {cuentas.length === 0
          ? "Agrega cuentas para armar el balance."
          : s.cuadra
            ? "El balance cuadra: activos = pasivos + patrimonio."
            : `El balance no cuadra: activos − (pasivos + patrimonio) = ${fmt(s.diferencia)}.`}
      </section>
    </div>
  );
}
