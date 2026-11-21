import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/session";
import { Formulario, Campo } from "@/components/Formulario";
import { crearIndirecto, borrarIndirecto } from "@/lib/acciones-costos";
import { CATEGORIAS, fmt } from "@/lib/formato";

export default async function Indirectos() {
  const { empresa, rol } = await requerirSesion();
  const filas = await db.costoIndirecto.findMany({
    where: { empresaId: empresa.id },
    orderBy: [{ categoria: "asc" }, { descripcion: "asc" }],
  });
  const edita = rol !== "CONSULTA";
  const total = filas.reduce((a, f) => a + f.montoMensual, 0);
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Costos indirectos</h1>
        <p className="text-sm text-ink-2">
          Montos mensuales que no se pueden asignar a un producto. Se reparten por prorrateo entre los
          productos según su producción.
        </p>
      </div>
      {edita && (
        <Formulario accion={crearIndirecto} boton="Agregar" limpiar className="grid items-end gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-2">Categoría</span>
            <select name="categoria" className="rounded-md border border-line-strong bg-field px-3 py-2">
              {Object.entries(CATEGORIAS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <Campo nombre="descripcion" etiqueta="Descripción" />
          <Campo nombre="montoMensual" etiqueta={`Monto mensual (${empresa.moneda})`} tipo="number" paso="any" />
        </Formulario>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-left text-ink-2">
            <th className="py-2">Categoría</th>
            <th>Descripción</th>
            <th className="text-right">Mensual</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id} className="border-b border-line-soft">
              <td className="py-2">{CATEGORIAS[f.categoria as keyof typeof CATEGORIAS] ?? f.categoria}</td>
              <td>{f.descripcion}</td>
              <td className="text-right tabular-nums">{fmt(f.montoMensual)}</td>
              <td className="text-right">
                {edita && (
                  <form action={borrarIndirecto}>
                    <input type="hidden" name="id" value={f.id} />
                    <button className="text-bad underline">Borrar</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-2" colSpan={2}>Total mensual</td>
            <td className="text-right tabular-nums">{fmt(total)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
