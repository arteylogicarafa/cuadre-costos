import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/session";
import { Formulario, Campo } from "@/components/Formulario";
import { crearMateria, borrarMateria } from "@/lib/acciones-datos";

const fmt = (n: number) =>
  n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 6 });

export default async function MateriaPrima() {
  const { empresa, rol } = await requerirSesion();
  const [materias, unidades] = await Promise.all([
    db.materiaPrima.findMany({
      where: { empresaId: empresa.id },
      orderBy: { codigo: "asc" },
      include: { unidad: true },
    }),
    db.unidadMedida.findMany({ where: { empresaId: empresa.id }, orderBy: { nombre: "asc" } }),
  ]);
  const puedeEditar = rol !== "CONSULTA";
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink">Materia prima</h1>
      {puedeEditar && (
        <Formulario accion={crearMateria} boton="Agregar" limpiar className="grid items-end gap-4 sm:grid-cols-3">
          <Campo nombre="codigo" etiqueta="Código (ej. MP01)" />
          <Campo nombre="nombre" etiqueta="Nombre" />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-2">Unidad</span>
            <select
              name="unidadId"
              required
              className="rounded-md border border-line-strong bg-field px-3 py-2"
            >
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </label>
          <Campo nombre="cantidad" etiqueta="Cantidad de la presentación" tipo="number" paso="any" />
          <Campo nombre="costoPresentacion" etiqueta={`Costo de la presentación (${empresa.moneda})`} tipo="number" paso="any" />
        </Formulario>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong text-left text-ink-2">
              <th className="py-2">Código</th>
              <th>Nombre</th>
              <th>Presentación</th>
              <th className="text-right">Costo</th>
              <th className="text-right">Costo unitario</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {materias.map((m) => (
              <tr key={m.id} className="border-b border-line-soft">
                <td className="py-2">{m.codigo}</td>
                <td>{m.nombre}</td>
                <td>
                  {fmt(m.cantidad)} {m.unidad.abreviatura}
                </td>
                <td className="text-right tabular-nums">{fmt(m.costoPresentacion)}</td>
                {/* Regla de la sección 4: costo de la presentación ÷ cantidad */}
                <td className="text-right tabular-nums">{fmt(m.costoPresentacion / m.cantidad)}</td>
                <td className="text-right">
                  {puedeEditar && (
                    <form action={borrarMateria}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="text-bad underline">Borrar</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {materias.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink-3">
                  Aún no hay materias primas. Agrega la primera arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
