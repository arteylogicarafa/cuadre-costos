import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/session";
import { Formulario, Campo } from "@/components/Formulario";
import { crearActivo, borrarActivo } from "@/lib/acciones-costos";
import { depreciacionMensual } from "@/lib/costos";
import { fmt } from "@/lib/formato";

export default async function Activos() {
  const { empresa, rol } = await requerirSesion();
  const filas = await db.activo.findMany({ where: { empresaId: empresa.id }, orderBy: { descripcion: "asc" } });
  const edita = rol !== "CONSULTA";
  const dep = (a: (typeof filas)[number]) => depreciacionMensual(a.costo, a.valorResidual, a.vidaUtilMeses);
  const total = filas.reduce((s, a) => s + dep(a), 0);
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Propiedad, planta y equipo</h1>
        <p className="text-sm text-ink-2">
          Depreciación mensual en línea recta: (costo − valor residual) ÷ vida útil en meses. Entra al
          prorrateo como costo indirecto.
        </p>
      </div>
      {edita && (
        <Formulario accion={crearActivo} boton="Agregar" limpiar className="grid items-end gap-4 sm:grid-cols-5">
          <Campo nombre="descripcion" etiqueta="Descripción" />
          <Campo nombre="costo" etiqueta={`Costo (${empresa.moneda})`} tipo="number" paso="any" />
          <Campo nombre="valorResidual" etiqueta="Valor residual" tipo="number" paso="any" valor={0} />
          <Campo nombre="vidaUtilMeses" etiqueta="Vida útil (meses)" tipo="number" paso="1" />
        </Formulario>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-left text-ink-2">
            <th className="py-2">Descripción</th>
            <th className="text-right">Costo</th>
            <th className="text-right">Residual</th>
            <th className="text-right">Vida (meses)</th>
            <th className="text-right">Depreciación mensual</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filas.map((a) => (
            <tr key={a.id} className="border-b border-line-soft">
              <td className="py-2">{a.descripcion}</td>
              <td className="text-right tabular-nums">{fmt(a.costo)}</td>
              <td className="text-right tabular-nums">{fmt(a.valorResidual)}</td>
              <td className="text-right tabular-nums">{a.vidaUtilMeses}</td>
              <td className="text-right tabular-nums">{fmt(dep(a))}</td>
              <td className="text-right">
                {edita && (
                  <form action={borrarActivo}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-bad underline">Borrar</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-2" colSpan={4}>Depreciación mensual total</td>
            <td className="text-right tabular-nums">{fmt(total)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
