import { db } from "@/lib/db";
import { requerirNomina } from "@/lib/session";
import { Formulario, Campo } from "@/components/Formulario";
import { crearCargo, borrarCargo, crearEmpleado, alternarEmpleado } from "@/lib/acciones-nomina";
import { fmt } from "@/lib/formato";

const AREAS = { PRODUCCION: "Producción", ADMINISTRACION: "Administración" } as const;

export default async function Empleados() {
  const { empresa } = await requerirNomina();
  const [cargos, empleados] = await Promise.all([
    db.cargo.findMany({
      where: { empresaId: empresa.id },
      orderBy: { nombre: "asc" },
      include: { _count: { select: { empleados: true } } },
    }),
    db.empleado.findMany({
      where: { empresaId: empresa.id },
      include: { cargo: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <h1 className="text-2xl font-semibold text-ink">Cargos y empleados</h1>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Cargos</h2>
        <p className="text-sm text-ink-2">
          El área del cargo decide a dónde va su costo: producción pasa a mano de obra de los productos y
          administración pasa a costos indirectos.
        </p>
        <Formulario accion={crearCargo} boton="Agregar cargo" limpiar className="grid items-end gap-4 sm:grid-cols-3">
          <Campo nombre="nombre" etiqueta="Nombre del cargo" />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-2">Área</span>
            <select name="area" className="rounded-md border border-line-strong bg-field px-3 py-2">
              <option value="PRODUCCION">Producción</option>
              <option value="ADMINISTRACION">Administración</option>
            </select>
          </label>
        </Formulario>
        <ul className="flex flex-wrap gap-2 text-sm">
          {cargos.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-full border border-line-strong px-3 py-1">
              {c.nombre} · {AREAS[c.area as keyof typeof AREAS]}
              {c._count.empleados === 0 && (
                <form action={borrarCargo}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="text-bad" aria-label={`Borrar cargo ${c.nombre}`}>×</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-ink">Nuevo empleado</h2>
        {cargos.length === 0 ? (
          <p className="text-sm text-ink-2">Crea primero al menos un cargo.</p>
        ) : (
          <Formulario accion={crearEmpleado} boton="Agregar empleado" limpiar className="grid items-end gap-4 sm:grid-cols-3">
            <Campo nombre="cedula" etiqueta="Cédula" />
            <Campo nombre="nombre" etiqueta="Nombre y apellido" />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-2">Cargo</span>
              <select name="cargoId" required className="rounded-md border border-line-strong bg-field px-3 py-2">
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </label>
            <Campo nombre="fechaIngreso" etiqueta="Fecha de ingreso" tipo="date" />
            <Campo nombre="salarioMensual" etiqueta={`Salario mensual (${empresa.moneda})`} tipo="number" paso="any" />
            <Campo nombre="bonoFijo" etiqueta="Otros bonos mensuales" tipo="number" paso="any" valor={0} />
            <Campo nombre="comision" etiqueta="Comisiones mensuales" tipo="number" paso="any" valor={0} />
          </Formulario>
        )}
      </section>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-left text-ink-2">
            <th className="py-2">Nombre</th>
            <th>Cédula</th>
            <th>Cargo</th>
            <th>Área</th>
            <th className="text-right">Salario</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {empleados.map((e) => (
            <tr key={e.id} className={`border-b border-line-soft ${e.activo ? "" : "text-ink-3"}`}>
              <td className="py-2">{e.nombre}</td>
              <td>{e.cedula}</td>
              <td>{e.cargo.nombre}</td>
              <td>{AREAS[e.cargo.area as keyof typeof AREAS]}</td>
              <td className="text-right tabular-nums">{fmt(e.salarioMensual)}</td>
              <td>{e.activo ? "Activo" : "Inactivo"}</td>
              <td className="text-right">
                <form action={alternarEmpleado}>
                  <input type="hidden" name="id" value={e.id} />
                  <button className="text-accent-ink underline">{e.activo ? "Desactivar" : "Activar"}</button>
                </form>
              </td>
            </tr>
          ))}
          {empleados.length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-ink-3">Aún no hay empleados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
