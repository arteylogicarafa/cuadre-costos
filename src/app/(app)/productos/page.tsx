import Link from "next/link";
import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/session";
import { Formulario, Campo } from "@/components/Formulario";
import { crearProducto, borrarProducto } from "@/lib/acciones-costos";

export default async function Productos() {
  const { empresa, rol } = await requerirSesion();
  const productos = await db.producto.findMany({
    where: { empresaId: empresa.id },
    orderBy: { codigo: "asc" },
    include: { _count: { select: { lineas: true, usadoEn: true } } },
  });
  const edita = rol !== "CONSULTA";
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Productos y recetas</h1>
        <p className="text-sm text-ink-2">
          Un producto principal se vende. Una sub-receta (guiso, masa) se usa como ingrediente de otros
          productos.
        </p>
      </div>
      {edita && (
        <Formulario accion={crearProducto} boton="Crear" limpiar className="grid items-end gap-4 sm:grid-cols-5">
          <Campo nombre="codigo" etiqueta="Código (ej. P001)" />
          <Campo nombre="nombre" etiqueta="Nombre" />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-2">Tipo</span>
            <select name="tipo" className="rounded-md border border-line-strong bg-field px-3 py-2">
              <option value="PRINCIPAL">Principal</option>
              <option value="SUBRECETA">Sub-receta</option>
            </select>
          </label>
          <Campo nombre="area" etiqueta="Área (opcional)" requerido={false} />
        </Formulario>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-left text-ink-2">
            <th className="py-2">Código</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th className="text-right">Componentes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id} className="border-b border-line-soft">
              <td className="py-2">{p.codigo}</td>
              <td>
                <Link href={`/productos/${p.id}`} className="text-accent-ink underline">
                  {p.nombre}
                </Link>
              </td>
              <td>{p.tipo === "PRINCIPAL" ? "Principal" : "Sub-receta"}</td>
              <td className="text-right tabular-nums">{p._count.lineas}</td>
              <td className="text-right">
                {edita && p._count.usadoEn === 0 && (
                  <form action={borrarProducto}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-bad underline">Borrar</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          {productos.length === 0 && (
            <tr><td colSpan={5} className="py-6 text-center text-ink-3">Aún no hay productos.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
