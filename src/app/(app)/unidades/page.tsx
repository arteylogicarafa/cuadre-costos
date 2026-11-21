import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/session";
import { Formulario, Campo } from "@/components/Formulario";
import { crearUnidad, borrarUnidad } from "@/lib/acciones-datos";

export default async function Unidades() {
  const { empresa, rol } = await requerirSesion();
  const unidades = await db.unidadMedida.findMany({
    where: { empresaId: empresa.id },
    orderBy: { nombre: "asc" },
    include: { _count: { select: { materias: true } } },
  });
  const puedeEditar = rol !== "CONSULTA";
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink">Unidades de medida</h1>
      {puedeEditar && (
        <Formulario accion={crearUnidad} boton="Agregar" limpiar className="grid items-end gap-4 sm:grid-cols-[1fr_8rem_auto]">
          <Campo nombre="nombre" etiqueta="Nombre" />
          <Campo nombre="abreviatura" etiqueta="Abreviatura" />
        </Formulario>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-left text-ink-2">
            <th className="py-2">Nombre</th>
            <th>Abrev.</th>
            <th>En uso</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {unidades.map((u) => (
            <tr key={u.id} className="border-b border-line-soft">
              <td className="py-2">{u.nombre}</td>
              <td>{u.abreviatura}</td>
              <td>{u._count.materias}</td>
              <td className="text-right">
                {puedeEditar && u._count.materias === 0 && (
                  <form action={borrarUnidad}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="text-bad underline">Borrar</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
