import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/session";
import { Formulario, Campo } from "@/components/Formulario";
import { crearInsumo, borrarInsumo } from "@/lib/acciones-costos";
import { fmt } from "@/lib/formato";

export default async function Insumos() {
  const { empresa, rol } = await requerirSesion();
  const insumos = await db.insumo.findMany({
    where: { empresaId: empresa.id },
    orderBy: { nombre: "asc" },
    include: { _count: { select: { lineas: true } } },
  });
  const edita = rol !== "CONSULTA";
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Insumos</h1>
        <p className="text-sm text-ink-2">Envases, tapas, etiquetas y servilletas. Se cuentan por unidad.</p>
      </div>
      {edita && (
        <Formulario accion={crearInsumo} boton="Agregar" limpiar className="grid items-end gap-4 sm:grid-cols-4">
          <Campo nombre="nombre" etiqueta="Nombre" />
          <Campo nombre="cantidad" etiqueta="Unidades en la presentación" tipo="number" paso="any" />
          <Campo nombre="costoPresentacion" etiqueta={`Costo (${empresa.moneda})`} tipo="number" paso="any" />
        </Formulario>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-left text-ink-2">
            <th className="py-2">Nombre</th>
            <th className="text-right">Presentación</th>
            <th className="text-right">Costo</th>
            <th className="text-right">Costo unitario</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {insumos.map((i) => (
            <tr key={i.id} className="border-b border-line-soft">
              <td className="py-2">{i.nombre}</td>
              <td className="text-right tabular-nums">{fmt(i.cantidad, 0)} und</td>
              <td className="text-right tabular-nums">{fmt(i.costoPresentacion)}</td>
              <td className="text-right tabular-nums">{fmt(i.costoPresentacion / i.cantidad, 4)}</td>
              <td className="text-right">
                {edita && i._count.lineas === 0 && (
                  <form action={borrarInsumo}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="text-bad underline">Borrar</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          {insumos.length === 0 && (
            <tr><td colSpan={5} className="py-6 text-center text-ink-3">Aún no hay insumos.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
