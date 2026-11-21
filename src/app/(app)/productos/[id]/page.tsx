import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/session";
import { Formulario, Campo } from "@/components/Formulario";
import { agregarLinea, borrarLinea, guardarProducto } from "@/lib/acciones-costos";
import { cargarEntrada } from "@/lib/datos-costos";
import { costosDirectos } from "@/lib/costos";
import { fmt } from "@/lib/formato";

export default async function Producto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { empresa, rol } = await requerirSesion();
  const producto = await db.producto.findFirst({
    where: { id, empresaId: empresa.id },
    include: {
      lineas: { include: { materia: { include: { unidad: true } }, insumo: true, subReceta: true } },
    },
  });
  if (!producto) notFound();

  const [materias, insumos, subs, entrada] = await Promise.all([
    db.materiaPrima.findMany({ where: { empresaId: empresa.id }, orderBy: { nombre: "asc" }, include: { unidad: true } }),
    db.insumo.findMany({ where: { empresaId: empresa.id }, orderBy: { nombre: "asc" } }),
    db.producto.findMany({ where: { empresaId: empresa.id, tipo: "SUBRECETA", NOT: { id } }, orderBy: { nombre: "asc" } }),
    cargarEntrada(empresa),
  ]);

  let cu: { mp: number; insumos: number; mo: number } | null = null;
  let errorCalculo: string | null = null;
  try {
    cu = costosDirectos(entrada)(id);
  } catch (e) {
    errorCalculo = (e as Error).message;
  }

  const costoLinea = (l: (typeof producto.lineas)[number]) => {
    if (l.materia) return l.cantidad * (l.materia.costoPresentacion / l.materia.cantidad);
    if (l.insumo) return l.cantidad * (l.insumo.costoPresentacion / l.insumo.cantidad);
    if (l.subRecetaId) {
      try {
        const s = costosDirectos(entrada)(l.subRecetaId);
        return l.cantidad * (s.mp + s.insumos);
      } catch {
        return 0;
      }
    }
    return 0;
  };
  const nombreLinea = (l: (typeof producto.lineas)[number]) =>
    l.materia ? `${l.materia.nombre} (${l.materia.unidad.abreviatura})` : l.insumo ? `${l.insumo.nombre} (und)` : `${l.subReceta?.nombre} (sub-receta)`;
  const tipoLinea = (l: (typeof producto.lineas)[number]) =>
    l.materia ? "Materia prima" : l.insumo ? "Insumo" : "Sub-receta";

  const edita = rol !== "CONSULTA";
  const total = producto.lineas.reduce((a, l) => a + costoLinea(l), 0);

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div>
        <Link href="/productos" className="text-sm text-accent-ink underline">← Productos</Link>
        <h1 className="mt-1 text-2xl font-semibold text-ink">
          {producto.codigo} · {producto.nombre}
        </h1>
        <p className="text-sm text-ink-2">{producto.tipo === "PRINCIPAL" ? "Producto principal" : "Sub-receta"}</p>
      </div>

      {edita && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-ink">Datos del producto</h2>
          <Formulario
            accion={guardarProducto.bind(null, producto.id)}
            boton="Guardar datos"
            className="grid items-end gap-4 sm:grid-cols-3"
          >
            <Campo nombre="nombre" etiqueta="Nombre" valor={producto.nombre} />
            <Campo nombre="area" etiqueta="Área" valor={producto.area ?? ""} requerido={false} />
            <Campo nombre="porciones" etiqueta="Porciones que rinde la receta" tipo="number" paso="any" valor={producto.porciones} />
            <Campo nombre="manoObra" etiqueta={`Mano de obra por unidad (${empresa.moneda})`} tipo="number" paso="any" valor={producto.manoObra} />
            {producto.tipo === "PRINCIPAL" && (
              <>
                <Campo nombre="produccionMensual" etiqueta="Producción mensual (unidades)" tipo="number" paso="any" valor={producto.produccionMensual} />
                <Campo nombre="pctUtilidad" etiqueta="Utilidad propia % (vacío = la de la empresa)" tipo="number" paso="any" requerido={false} valor={producto.pctUtilidad === null ? "" : Number((producto.pctUtilidad * 100).toFixed(4))} />
              </>
            )}
          </Formulario>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Receta</h2>
        {edita && (
          <Formulario accion={agregarLinea.bind(null, producto.id)} boton="Agregar" limpiar className="grid items-end gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-2">Componente</span>
              <select name="componente" required className="rounded-md border border-line-strong bg-field px-3 py-2">
                <optgroup label="Materia prima">
                  {materias.map((m) => (
                    <option key={m.id} value={`mp:${m.id}`}>{m.nombre} ({m.unidad.abreviatura})</option>
                  ))}
                </optgroup>
                <optgroup label="Insumos">
                  {insumos.map((i) => (
                    <option key={i.id} value={`in:${i.id}`}>{i.nombre}</option>
                  ))}
                </optgroup>
                <optgroup label="Sub-recetas">
                  {subs.map((s) => (
                    <option key={s.id} value={`sr:${s.id}`}>{s.nombre}</option>
                  ))}
                </optgroup>
              </select>
            </label>
            <Campo nombre="cantidad" etiqueta="Cantidad (en la unidad indicada)" tipo="number" paso="any" />
          </Formulario>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong text-left text-ink-2">
              <th className="py-2">Tipo</th>
              <th>Componente</th>
              <th className="text-right">Cantidad</th>
              <th className="text-right">Costo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {producto.lineas.map((l) => (
              <tr key={l.id} className="border-b border-line-soft">
                <td className="py-2">{tipoLinea(l)}</td>
                <td>{nombreLinea(l)}</td>
                <td className="text-right tabular-nums">{fmt(l.cantidad, 2)}</td>
                <td className="text-right tabular-nums">{fmt(costoLinea(l), 4)}</td>
                <td className="text-right">
                  {edita && (
                    <form action={borrarLinea}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="productoId" value={producto.id} />
                      <button className="text-bad underline">Quitar</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {producto.lineas.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-ink-3">La receta está vacía.</td></tr>
            )}
            <tr className="font-semibold">
              <td className="py-2" colSpan={3}>Costo total de la receta</td>
              <td className="text-right tabular-nums">{fmt(total, 4)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="mb-2 font-semibold text-ink">Costo directo por unidad</h2>
        {errorCalculo ? (
          <p role="alert" className="text-sm text-bad">{errorCalculo}</p>
        ) : (
          cu && (
            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div><dt className="text-ink-3">Materia prima</dt><dd className="tabular-nums">{fmt(cu.mp, 4)}</dd></div>
              <div><dt className="text-ink-3">Insumos</dt><dd className="tabular-nums">{fmt(cu.insumos, 4)}</dd></div>
              <div><dt className="text-ink-3">Mano de obra</dt><dd className="tabular-nums">{fmt(cu.mo, 4)}</dd></div>
              <div><dt className="text-ink-3">Total directo</dt><dd className="font-semibold tabular-nums">{fmt(cu.mp + cu.insumos + cu.mo, 4)}</dd></div>
            </dl>
          )
        )}
        <p className="mt-2 text-xs text-ink-3">
          El indirecto, los gastos ajenos, la utilidad y el IVA se ven en el informe de estructura de costos.
        </p>
      </section>
    </div>
  );
}
