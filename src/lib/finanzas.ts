// Cálculos financieros sin dependencias: ventas, estado de resultados y cuadre del balance.

export type VentaCalc = {
  cantidad: number;
  precioUnitario: number; // sin IVA
  descuento: number; // monto total
  exento: boolean;
  pctIva: number;
  costoUnitDirecto: number;
  costoUnitTotal: number;
};

export type ResultadoVenta = {
  bruto: number;
  base: number; // base imponible (o monto exento) después del descuento
  iva: number;
  total: number;
  costoDirecto: number;
  costoTotal: number;
  utilidad: number; // base − costo total
  pctUtilidad: number; // utilidad ÷ costo total (como en la hoja de manufactura de referencia)
};

export function calcularVenta(v: VentaCalc): ResultadoVenta {
  const bruto = v.cantidad * v.precioUnitario;
  const base = Math.max(bruto - v.descuento, 0);
  const iva = v.exento ? 0 : base * v.pctIva;
  const costoDirecto = v.cantidad * v.costoUnitDirecto;
  const costoTotal = v.cantidad * v.costoUnitTotal;
  const utilidad = base - costoTotal;
  return {
    bruto,
    base,
    iva,
    total: base + iva,
    costoDirecto,
    costoTotal,
    utilidad,
    pctUtilidad: costoTotal > 0 ? utilidad / costoTotal : 0,
  };
}

export type ResumenProducto = {
  productoId: string;
  nombre: string;
  cantidad: number;
  base: number;
  iva: number;
  total: number;
  costoTotal: number;
  utilidad: number;
  pctUtilidad: number;
};

/** Relación de ventas por producto: suma todas las ventas del mismo producto. */
export function resumirPorProducto(
  ventas: { productoId: string; nombre: string; venta: VentaCalc }[],
): ResumenProducto[] {
  const mapa = new Map<string, ResumenProducto>();
  for (const { productoId, nombre, venta } of ventas) {
    const r = calcularVenta(venta);
    const a =
      mapa.get(productoId) ??
      { productoId, nombre, cantidad: 0, base: 0, iva: 0, total: 0, costoTotal: 0, utilidad: 0, pctUtilidad: 0 };
    a.cantidad += venta.cantidad;
    a.base += r.base;
    a.iva += r.iva;
    a.total += r.total;
    a.costoTotal += r.costoTotal;
    a.utilidad += r.utilidad;
    mapa.set(productoId, a);
  }
  const filas = [...mapa.values()];
  for (const f of filas) f.pctUtilidad = f.costoTotal > 0 ? f.utilidad / f.costoTotal : 0;
  return filas.sort((a, b) => b.base - a.base);
}

export type Resultados = {
  ingresos: number;
  costoVentas: number; // costos directos de lo vendido
  utilidadBruta: number;
  gastos: number; // pagos del período
  utilidadNeta: number;
  margenBruto: number; // sobre ingresos
  margenNeto: number;
};

/**
 * Estado de resultados. El costo de ventas lleva solo costos DIRECTOS (materia prima, insumos y mano de obra de
 * producción). Los indirectos y la nómina de administración entran como gastos cuando se pagan, para no contarlos dos veces.
 */
export function calcularResultados(ventas: VentaCalc[], gastos: number): Resultados {
  let ingresos = 0;
  let costoVentas = 0;
  for (const v of ventas) {
    const r = calcularVenta(v);
    ingresos += r.base;
    costoVentas += r.costoDirecto;
  }
  const utilidadBruta = ingresos - costoVentas;
  const utilidadNeta = utilidadBruta - gastos;
  return {
    ingresos,
    costoVentas,
    utilidadBruta,
    gastos,
    utilidadNeta,
    margenBruto: ingresos > 0 ? utilidadBruta / ingresos : 0,
    margenNeto: ingresos > 0 ? utilidadNeta / ingresos : 0,
  };
}

export type Situacion = { activos: number; pasivos: number; patrimonio: number; diferencia: number; cuadra: boolean };

/** Balance cargado a mano: activos = pasivos + patrimonio. Tolera diferencias menores a un centavo. */
export function calcularSituacion(cuentas: { tipo: string; monto: number }[]): Situacion {
  const suma = (t: string) => cuentas.filter((c) => c.tipo === t).reduce((s, c) => s + c.monto, 0);
  const activos = suma("ACTIVO");
  const pasivos = suma("PASIVO");
  const patrimonio = suma("PATRIMONIO");
  const diferencia = activos - (pasivos + patrimonio);
  return { activos, pasivos, patrimonio, diferencia, cuadra: Math.abs(diferencia) < 0.005 };
}

/** Rango [desde, hasta) en UTC de un período AAAA-MM. */
export function rangoPeriodo(periodo: string) {
  const [a, m] = periodo.split("-").map(Number);
  return { desde: new Date(Date.UTC(a, m - 1, 1)), hasta: new Date(Date.UTC(a, m, 1)) };
}

/** Los últimos `n` períodos AAAA-MM terminando en `hasta`, del más antiguo al más reciente. */
export function ultimosPeriodos(hasta: string, n: number) {
  const [a, m] = hasta.split("-").map(Number);
  const lista: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(a, m - 1 - i, 1));
    lista.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return lista;
}

export const periodoDeFecha = (f: Date) => f.toISOString().slice(0, 7);
