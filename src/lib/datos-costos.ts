import "server-only";
import { db } from "./db";
import { costoUnitario, depreciacionMensual, type Entrada } from "./costos";
import { nominaDelPeriodo } from "./datos-nomina";
import { periodoActual } from "./nomina";

type EmpresaParams = { id: string; pctGastosAjenos: number; pctUtilidad: number; pctIva: number };

/** Lee todo lo necesario de la empresa y lo deja en el formato del motor de cálculo. */
export async function cargarEntrada(e: EmpresaParams): Promise<Entrada & { depreciacion: number; indirectos: number; nominaAdministracion: number }> {
  const [productos, materias, insumos, indirectos, activos] = await Promise.all([
    db.producto.findMany({ where: { empresaId: e.id }, include: { lineas: true }, orderBy: { codigo: "asc" } }),
    db.materiaPrima.findMany({ where: { empresaId: e.id } }),
    db.insumo.findMany({ where: { empresaId: e.id } }),
    db.costoIndirecto.findMany({ where: { empresaId: e.id } }),
    db.activo.findMany({ where: { empresaId: e.id } }),
  ]);
  const depreciacion = activos.reduce(
    (s, a) => s + depreciacionMensual(a.costo, a.valorResidual, a.vidaUtilMeses),
    0,
  );
  const ind = indirectos.reduce((s, i) => s + i.montoMensual, 0);
  // Nómina del mes en curso: producción va a mano de obra, administración a indirectos.
  const nomina = await nominaDelPeriodo(e.id, periodoActual());
  return {
    nominaProduccionMensual: nomina.costoProduccion,
    nominaAdministracion: nomina.costoAdministracion,
    productos,
    costoUnitMateria: Object.fromEntries(materias.map((m) => [m.id, costoUnitario(m.costoPresentacion, m.cantidad)])),
    costoUnitInsumo: Object.fromEntries(insumos.map((i) => [i.id, costoUnitario(i.costoPresentacion, i.cantidad)])),
    indirectoMensual: ind + depreciacion + nomina.costoAdministracion,
    pctGastosAjenos: e.pctGastosAjenos,
    pctUtilidad: e.pctUtilidad,
    pctIva: e.pctIva,
    depreciacion,
    indirectos: ind,
  };
}
