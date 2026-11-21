import { db } from "@/lib/db";
import { requerirNomina } from "@/lib/session";
import { Formulario, Campo } from "@/components/Formulario";
import { guardarParametros } from "@/lib/acciones-nomina";
import { PARAMS_POR_DEFECTO, paramsDelPeriodo, periodoActual } from "@/lib/nomina";

const p100 = (x: number) => Number((x * 100).toFixed(4));

export default async function Parametros() {
  const { empresa, rol } = await requerirNomina();
  const lista = await db.parametroNomina.findMany({
    where: { empresaId: empresa.id },
    orderBy: { vigenciaDesde: "desc" },
  });
  const actual = periodoActual();
  const v = paramsDelPeriodo(lista, actual) ?? { ...PARAMS_POR_DEFECTO, vigenciaDesde: actual };
  const admin = rol === "ADMIN";

  const campos: { n: string; t: string; v: number; pct?: boolean }[] = [
    { n: "salarioMinimo", t: `Salario mínimo (${empresa.moneda})`, v: v.salarioMinimo },
    { n: "bonoAlimentacion", t: "Bono de alimentación (mensual)", v: v.bonoAlimentacion },
    { n: "pctRiesgoIvss", t: "IVSS patrono según riesgo (%)", v: p100(v.pctRiesgoIvss), pct: true },
    { n: "pctIvssTrab", t: "IVSS trabajador (%)", v: p100(v.pctIvssTrab), pct: true },
    { n: "pctRpeTrab", t: "RPE trabajador (%)", v: p100(v.pctRpeTrab), pct: true },
    { n: "pctRpePatrono", t: "RPE patrono (%)", v: p100(v.pctRpePatrono), pct: true },
    { n: "pctFaovTrab", t: "FAOV trabajador (%)", v: p100(v.pctFaovTrab), pct: true },
    { n: "pctFaovPatrono", t: "FAOV patrono (%)", v: p100(v.pctFaovPatrono), pct: true },
    { n: "pctIncesTrab", t: "INCES trabajador (%)", v: p100(v.pctIncesTrab), pct: true },
    { n: "pctIncesPatrono", t: "INCES patrono (%)", v: p100(v.pctIncesPatrono), pct: true },
    { n: "topeIvssSm", t: "Tope IVSS (salarios mínimos)", v: v.topeIvssSm },
    { n: "topeRpeSm", t: "Tope RPE (salarios mínimos)", v: v.topeRpeSm },
    { n: "diasUtilidades", t: "Días de utilidades al año", v: v.diasUtilidades },
    { n: "diasBonoVacMes", t: "Días de bono vacacional por mes", v: v.diasBonoVacMes },
    { n: "horasJornada", t: "Horas por jornada", v: v.horasJornada },
    { n: "recargoNocturno", t: "Factor de jornada nocturna", v: v.recargoNocturno },
    { n: "recargoExtra", t: "Factor de horas extras y feriados", v: v.recargoExtra },
    { n: "diasMes", t: "Días del mes", v: v.diasMes },
  ];

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Parámetros de nómina</h1>
        <p className="text-sm text-ink-2">
          Cada conjunto tiene una fecha de vigencia. Un mes se calcula con el conjunto vigente en ese mes,
          así que actualizar los valores no cambia los meses anteriores. Estos valores vienen de una hoja de nómina
          de referencia: revísalos con tu contador antes de usarlos.
        </p>
      </div>
      {!lista.length && (
        <p className="text-sm text-warn">
          Aún no has guardado parámetros: el cálculo usa los valores por defecto de la hoja de referencia.
        </p>
      )}
      {admin ? (
        <Formulario accion={guardarParametros} boton="Guardar vigencia" className="grid gap-4 sm:grid-cols-3">
          <Campo nombre="vigenciaDesde" etiqueta="Vigente desde (AAAA-MM)" valor={actual} />
          {campos.map((c) => (
            <Campo key={c.n} nombre={c.n} etiqueta={c.t} tipo="number" paso="any" valor={c.v} />
          ))}
        </Formulario>
      ) : (
        <p className="text-sm text-ink-2">Solo un administrador puede cambiar los parámetros.</p>
      )}
      {lista.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-ink">Vigencias guardadas</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line-strong text-left text-ink-2">
                <th className="py-2">Desde</th>
                <th className="text-right">Salario mínimo</th>
                <th className="text-right">Bono de alimentación</th>
                <th className="text-right">IVSS patrono</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((x) => (
                <tr key={x.id} className="border-b border-line-soft tabular-nums">
                  <td className="py-2">{x.vigenciaDesde}</td>
                  <td className="text-right">{x.salarioMinimo}</td>
                  <td className="text-right">{x.bonoAlimentacion}</td>
                  <td className="text-right">{p100(x.pctRiesgoIvss)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
