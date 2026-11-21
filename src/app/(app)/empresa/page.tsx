import { Formulario, Campo } from "@/components/Formulario";
import { requerirSesion } from "@/lib/session";
import { guardarEmpresa } from "@/lib/acciones-datos";

// Evita errores de coma flotante al mostrar 0.125 * 100 = 12.5
const pct = (x: number) => Number((x * 100).toFixed(4));

export default async function Empresa() {
  const { empresa: e, rol } = await requerirSesion();
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink">Datos de la empresa</h1>
      {rol !== "ADMIN" && (
        <p className="text-sm text-ink-2">Solo un administrador puede editar estos datos.</p>
      )}
      <Formulario accion={guardarEmpresa} boton="Guardar" className="grid gap-4 sm:grid-cols-2">
        <Campo nombre="razonSocial" etiqueta="Razón social" valor={e.razonSocial} />
        <Campo nombre="rif" etiqueta="RIF" valor={e.rif ?? ""} requerido={false} />
        <div className="sm:col-span-2">
          <Campo nombre="direccion" etiqueta="Dirección" valor={e.direccion ?? ""} requerido={false} />
        </div>
        <Campo nombre="moneda" etiqueta="Moneda (código)" valor={e.moneda} />
        <Campo nombre="tasaCambio" etiqueta="Tasa de cambio" tipo="number" paso="any" valor={e.tasaCambio} />
        <Campo nombre="pctGastosAjenos" etiqueta="Gastos ajenos (%)" tipo="number" paso="any" valor={pct(e.pctGastosAjenos)} />
        <Campo nombre="pctUtilidad" etiqueta="Utilidad (%)" tipo="number" paso="any" valor={pct(e.pctUtilidad)} />
        <Campo nombre="pctIva" etiqueta="IVA (%)" tipo="number" paso="any" valor={pct(e.pctIva)} />
      </Formulario>
    </div>
  );
}
