// Motor de cálculo de costos. Sin dependencias: se prueba solo con datos planos.
// Reglas de la sección 4 de la especificación.

export type Linea = {
  materiaId?: string | null;
  insumoId?: string | null;
  subRecetaId?: string | null;
  cantidad: number;
};

export type ProductoCalc = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string; // PRINCIPAL | SUBRECETA
  porciones: number;
  manoObra: number; // por unidad
  produccionMensual: number;
  pctUtilidad: number | null;
  lineas: Linea[];
};

export type Entrada = {
  productos: ProductoCalc[];
  costoUnitMateria: Record<string, number>; // id -> costo por unidad
  costoUnitInsumo: Record<string, number>;
  indirectoMensual: number; // costos indirectos + depreciación + nómina de administración
  nominaProduccionMensual?: number; // costo de la nómina de producción, se reparte como mano de obra
  pctGastosAjenos: number; // fracciones: 0.125
  pctUtilidad: number;
  pctIva: number;
};

export type Estructura = {
  id: string;
  codigo: string;
  nombre: string;
  materiaPrima: number; // incluye sub-recetas
  insumos: number;
  manoObra: number;
  directo: number;
  indirecto: number;
  costoTotal: number;
  gastosAjenos: number;
  utilidad: number;
  precioSinIva: number;
  iva: number;
  precio: number;
  produccion: number;
  pctProrrateo: number;
};

export function costoUnitario(costoPresentacion: number, cantidad: number) {
  return cantidad > 0 ? costoPresentacion / cantidad : 0;
}

/** Depreciación mensual en línea recta. */
export function depreciacionMensual(costo: number, residual: number, vidaMeses: number) {
  return vidaMeses > 0 ? Math.max(costo - residual, 0) / vidaMeses : 0;
}

/** Costo directo por unidad de cada producto, resolviendo sub-recetas. Lanza error si hay ciclos. */
export function costosDirectos(e: Entrada) {
  const porId = new Map(e.productos.map((p) => [p.id, p]));
  const memo = new Map<string, { mp: number; insumos: number; mo: number }>();
  const enCurso = new Set<string>();

  function calc(id: string): { mp: number; insumos: number; mo: number } {
    const hecho = memo.get(id);
    if (hecho) return hecho;
    if (enCurso.has(id)) throw new Error("Hay una sub-receta que se usa a sí misma");
    const p = porId.get(id);
    if (!p) return { mp: 0, insumos: 0, mo: 0 };
    enCurso.add(id);
    let mp = 0;
    let insumos = 0;
    for (const l of p.lineas) {
      if (l.materiaId) mp += l.cantidad * (e.costoUnitMateria[l.materiaId] ?? 0);
      else if (l.insumoId) insumos += l.cantidad * (e.costoUnitInsumo[l.insumoId] ?? 0);
      else if (l.subRecetaId) {
        // calc() ya devuelve el costo por unidad (porción) de la sub-receta
        const s = calc(l.subRecetaId);
        mp += l.cantidad * (s.mp + s.insumos);
      }
    }
    const div = p.porciones > 0 ? p.porciones : 1;
    const r = { mp: mp / div, insumos: insumos / div, mo: p.manoObra };
    enCurso.delete(id);
    memo.set(id, r);
    return r;
  }

  return (id: string) => calc(id);
}

export function calcularEstructuras(e: Entrada): Estructura[] {
  const directo = costosDirectos(e);
  const vendibles = e.productos.filter((p) => p.tipo === "PRINCIPAL");
  const produccionTotal = vendibles.reduce((a, p) => a + Math.max(p.produccionMensual, 0), 0);
  // Prorrateo por unidades: % del producto = su producción / producción total.
  // Cada unidad lleva (indirecto × %) ÷ unidades del producto = indirecto ÷ producción total.
  const indirectoPorUnidad = produccionTotal > 0 ? e.indirectoMensual / produccionTotal : 0;
  // La nómina de producción se reparte igual: entre las unidades producidas.
  const nominaPorUnidad =
    produccionTotal > 0 ? (e.nominaProduccionMensual ?? 0) / produccionTotal : 0;

  return vendibles.map((p) => {
    const d = directo(p.id);
    const mo = d.mo + nominaPorUnidad;
    const dirTotal = d.mp + d.insumos + mo;
    const costoTotal = dirTotal + indirectoPorUnidad;
    const gastosAjenos = costoTotal * e.pctGastosAjenos;
    const base = costoTotal + gastosAjenos;
    const utilidad = base * (p.pctUtilidad ?? e.pctUtilidad);
    const precioSinIva = base + utilidad;
    const iva = precioSinIva * e.pctIva;
    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      materiaPrima: d.mp,
      insumos: d.insumos,
      manoObra: mo,
      directo: dirTotal,
      indirecto: indirectoPorUnidad,
      costoTotal,
      gastosAjenos,
      utilidad,
      precioSinIva,
      iva,
      precio: precioSinIva + iva,
      produccion: p.produccionMensual,
      pctProrrateo: produccionTotal > 0 ? p.produccionMensual / produccionTotal : 0,
    };
  });
}

/** ¿Agregar `subId` como ingrediente de `productoId` crearía un ciclo? */
export function creaCiclo(
  productoId: string,
  subId: string,
  lineas: { productoId: string; subRecetaId?: string | null }[],
) {
  if (productoId === subId) return true;
  const pila = [subId];
  const visto = new Set<string>();
  while (pila.length) {
    const actual = pila.pop()!;
    if (actual === productoId) return true;
    if (visto.has(actual)) continue;
    visto.add(actual);
    for (const l of lineas) if (l.productoId === actual && l.subRecetaId) pila.push(l.subRecetaId);
  }
  return false;
}

/* ---------- Simulador de combos ---------- */

export type ItemCombo = { precioSinIva: number; costoTotal: number; cantidad: number };

export type ResultadoCombo = {
  costo: number;
  precioLista: number; // suma de los precios sin IVA
  descuento: number;
  precioSinIva: number;
  iva: number;
  precioFinal: number;
  utilidad: number;
  margen: number; // utilidad ÷ precio sin IVA
  pierde: boolean; // el precio con descuento queda por debajo del costo
};

/** Precio y margen de un combo de productos con un descuento porcentual (0.1 = 10 %). */
export function simularCombo(items: ItemCombo[], pctDescuento: number, pctIva: number): ResultadoCombo {
  const d = Math.min(Math.max(pctDescuento, 0), 1);
  const costo = items.reduce((s, i) => s + i.cantidad * i.costoTotal, 0);
  const precioLista = items.reduce((s, i) => s + i.cantidad * i.precioSinIva, 0);
  const descuento = precioLista * d;
  const precioSinIva = precioLista - descuento;
  const iva = precioSinIva * pctIva;
  const utilidad = precioSinIva - costo;
  return {
    costo, precioLista, descuento, precioSinIva, iva,
    precioFinal: precioSinIva + iva,
    utilidad,
    margen: precioSinIva > 0 ? utilidad / precioSinIva : 0,
    pierde: precioSinIva < costo,
  };
}

/* ---------- Proyecciones y punto de equilibrio ---------- */

export type ProductoProyeccion = { nombre: string; unidades: number; precioSinIva: number; costoVariable: number };
export type Escenario = { pctUnidades: number; pctPrecio: number; pctVariable: number; pctFijos: number };

export type FilaProyeccion = {
  nombre: string; unidades: number; ingresos: number; costoVariable: number; contribucion: number;
};

export type Proyeccion = {
  filas: FilaProyeccion[];
  ingresos: number;
  costoVariable: number;
  contribucion: number;
  fijos: number;
  utilidad: number;
  unidades: number;
  /** Unidades al mes para no perder ni ganar, manteniendo la mezcla de productos. null si no hay contribución. */
  equilibrio: number | null;
  /** Qué tanto pueden bajar las ventas antes de perder (0.2 = 20 %). null si no aplica. */
  margenSeguridad: number | null;
};

/**
 * Separa lo que cambia con las unidades (variable) de lo que no (fijo): materia prima, insumos y mano de obra propia
 * son variables; los indirectos, la depreciación, la nómina de administración y la de producción son fijos del mes.
 */
export function variablesYFijos(
  e: Entrada,
  estructuras: Estructura[],
): { productos: ProductoProyeccion[]; fijos: number } {
  const total = estructuras.reduce((a, f) => a + Math.max(f.produccion, 0), 0);
  const nominaUnit = total > 0 ? (e.nominaProduccionMensual ?? 0) / total : 0;
  return {
    productos: estructuras.map((f) => ({
      nombre: f.nombre,
      unidades: f.produccion,
      precioSinIva: f.precioSinIva,
      costoVariable: f.materiaPrima + f.insumos + (f.manoObra - nominaUnit),
    })),
    fijos: total > 0 ? e.indirectoMensual + (e.nominaProduccionMensual ?? 0) : 0,
  };
}

export function proyectar(
  productos: ProductoProyeccion[],
  fijosMensuales: number,
  esc: Escenario,
): Proyeccion {
  const filas = productos.map((p) => {
    const unidades = p.unidades * (1 + esc.pctUnidades);
    const ingresos = unidades * p.precioSinIva * (1 + esc.pctPrecio);
    const costoVariable = unidades * p.costoVariable * (1 + esc.pctVariable);
    return { nombre: p.nombre, unidades, ingresos, costoVariable, contribucion: ingresos - costoVariable };
  });
  const sum = (f: (x: FilaProyeccion) => number) => filas.reduce((s, x) => s + f(x), 0);
  const ingresos = sum((x) => x.ingresos);
  const costoVariable = sum((x) => x.costoVariable);
  const contribucion = ingresos - costoVariable;
  const unidades = sum((x) => x.unidades);
  const fijos = fijosMensuales * (1 + esc.pctFijos);
  const contribPorUnidad = unidades > 0 ? contribucion / unidades : 0;
  const equilibrio = contribPorUnidad > 0 ? fijos / contribPorUnidad : null;
  return {
    filas, ingresos, costoVariable, contribucion, fijos, unidades,
    utilidad: contribucion - fijos,
    equilibrio,
    margenSeguridad: equilibrio !== null && unidades > 0 ? (unidades - equilibrio) / unidades : null,
  };
}
