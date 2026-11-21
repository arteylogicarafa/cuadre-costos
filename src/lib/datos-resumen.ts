import "server-only";
import { db } from "./db";
import { cargarEntrada } from "./datos-costos";
import { calcularEstructuras, proyectar, variablesYFijos, type Estructura } from "./costos";
import { aCalc } from "./datos-finanzas";
import { calcularSituacion, calcularVenta, periodoDeFecha, rangoPeriodo, ultimosPeriodos } from "./finanzas";
import { periodoActual } from "./nomina";

type EmpresaBase = { id: string; pctGastosAjenos: number; pctUtilidad: number; pctIva: number };

export type Pendiente = { texto: string; href: string };

export type Resumen = {
  periodo: string;
  serie: { periodo: string; ingresos: number; egresos: number }[];
  utilidad: number;
  utilidadPrevia: number;
  ingresos: number;
  costoUnitario: { materiaPrima: number; insumos: number; manoObra: number; indirecto: number; total: number } | null;
  productos: { nombre: string; precio: number; margen: number }[];
  equilibrio: { unidades: number | null; vendidas: number; seguridad: number | null } | null;
  pendientes: Pendiente[];
  errorCalculo: string | null;
};

/** Reúne todo lo que muestra el dashboard del mes en curso, con las mismas reglas del resto del sistema. */
export async function cargarResumen(empresa: EmpresaBase): Promise<Resumen> {
  const periodo = periodoActual();
  const periodos = ultimosPeriodos(periodo, 12);
  const desde = rangoPeriodo(periodos[0]).desde;
  const hasta = rangoPeriodo(periodo).hasta;

  const [ventas, pagos] = await Promise.all([
    db.venta.findMany({ where: { empresaId: empresa.id, fecha: { gte: desde, lt: hasta } } }),
    db.pago.findMany({ where: { empresaId: empresa.id, fecha: { gte: desde, lt: hasta } } }),
  ]);

  const serie = periodos.map((p) => {
    const vs = ventas.filter((v) => periodoDeFecha(v.fecha) === p).map((v) => calcularVenta(aCalc(v)));
    const ingresos = vs.reduce((s, r) => s + r.base, 0);
    const costo = vs.reduce((s, r) => s + r.costoDirecto, 0);
    const gastos = pagos.filter((x) => periodoDeFecha(x.fecha) === p).reduce((s, x) => s + x.monto, 0);
    return { periodo: p, ingresos, egresos: costo + gastos };
  });
  const actual = serie[serie.length - 1];
  const previo = serie[serie.length - 2];

  // Costeo: composición del costo por unidad, márgenes y punto de equilibrio.
  let errorCalculo: string | null = null;
  let estructuras: Estructura[] = [];
  let entrada: Awaited<ReturnType<typeof cargarEntrada>> | null = null;
  try {
    entrada = await cargarEntrada(empresa);
    estructuras = calcularEstructuras(entrada);
  } catch (e) {
    errorCalculo = (e as Error).message;
  }

  const unidades = estructuras.reduce((s, f) => s + Math.max(f.produccion, 0), 0);
  const pesado = (f: (e: Estructura) => number) =>
    unidades > 0 ? estructuras.reduce((s, e) => s + Math.max(e.produccion, 0) * f(e), 0) / unidades : 0;
  const costoUnitario =
    estructuras.length > 0 && unidades > 0
      ? {
          materiaPrima: pesado((e) => e.materiaPrima),
          insumos: pesado((e) => e.insumos),
          manoObra: pesado((e) => e.manoObra),
          indirecto: pesado((e) => e.indirecto),
          total: pesado((e) => e.costoTotal),
        }
      : null;

  const productos = estructuras
    .map((f) => ({
      nombre: f.nombre,
      precio: f.precioSinIva,
      margen: f.precioSinIva > 0 ? (f.precioSinIva - f.costoTotal) / f.precioSinIva : 0,
    }))
    .sort((a, b) => b.margen - a.margen);

  let equilibrio: Resumen["equilibrio"] = null;
  if (entrada && estructuras.length > 0 && unidades > 0) {
    const { productos: pp, fijos } = variablesYFijos(entrada, estructuras);
    const p = proyectar(pp, fijos, { pctUnidades: 0, pctPrecio: 0, pctVariable: 0, pctFijos: 0 });
    equilibrio = { unidades: p.equilibrio, vendidas: p.unidades, seguridad: p.margenSeguridad };
  }

  // Pendientes: lo que falta cargar o revisar para que las cifras sean confiables.
  const pendientes: Pendiente[] = [];
  if (entrada) {
    const sinReceta = entrada.productos.filter((p) => p.tipo === "PRINCIPAL" && p.lineas.length === 0);
    if (sinReceta.length)
      pendientes.push({ texto: `${sinReceta.length} producto(s) sin receta: ${sinReceta.slice(0, 2).map((p) => p.nombre).join(", ")}`, href: "/productos" });
    const sinProduccion = entrada.productos.filter((p) => p.tipo === "PRINCIPAL" && p.produccionMensual <= 0);
    if (sinProduccion.length)
      pendientes.push({ texto: `${sinProduccion.length} producto(s) sin producción mensual: no reciben costos indirectos`, href: "/productos" });
  }
  const [empleados, paramsNomina, cuentas] = await Promise.all([
    db.empleado.count({ where: { empresaId: empresa.id, activo: true } }),
    db.parametroNomina.count({ where: { empresaId: empresa.id } }),
    db.cuentaContable.findMany({ where: { empresaId: empresa.id }, include: { saldos: { where: { periodo } } } }),
  ]);
  if (empleados > 0 && paramsNomina === 0)
    pendientes.push({ texto: "La nómina usa valores por defecto: guarda los parámetros legales", href: "/nomina/parametros" });
  if (ventas.filter((v) => periodoDeFecha(v.fecha) === periodo).length === 0)
    pendientes.push({ texto: "No hay ventas registradas este mes", href: "/ventas" });
  if (cuentas.length > 0) {
    const s = calcularSituacion(cuentas.map((c) => ({ tipo: c.tipo, monto: c.saldos[0]?.monto ?? 0 })));
    if (!s.cuadra) pendientes.push({ texto: "El estado de situación de este mes no cuadra", href: "/finanzas/situacion" });
  }

  return {
    periodo,
    serie,
    utilidad: actual.ingresos - actual.egresos,
    utilidadPrevia: previo ? previo.ingresos - previo.egresos : 0,
    ingresos: actual.ingresos,
    costoUnitario,
    productos,
    equilibrio,
    pendientes,
    errorCalculo,
  };
}
