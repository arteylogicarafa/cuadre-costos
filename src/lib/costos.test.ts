import test from "node:test";
import assert from "node:assert/strict";
import {
  calcularEstructuras,
  costoUnitario,
  creaCiclo,
  depreciacionMensual,
  type Entrada,
} from "./costos.ts";

const cerca = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("costo unitario del arroz de las hojas de referencia", () => {
  cerca(costoUnitario(2.63225, 900), 0.0029247222222222222);
});

test("depreciación en línea recta", () => {
  cerca(depreciacionMensual(1200, 0, 60), 20);
  cerca(depreciacionMensual(1200, 200, 50), 20);
  cerca(depreciacionMensual(100, 500, 10), 0); // residual mayor que el costo
});

const base: Entrada = {
  productos: [
    {
      id: "guiso", codigo: "S1", nombre: "Guiso", tipo: "SUBRECETA", porciones: 10,
      manoObra: 0, produccionMensual: 0, pctUtilidad: null,
      lineas: [{ materiaId: "carne", cantidad: 500 }], // 500 g * 0.03 = 15 -> 1.5 por porción
    },
    {
      id: "pastel", codigo: "P1", nombre: "Pastel", tipo: "PRINCIPAL", porciones: 1,
      manoObra: 0.2, produccionMensual: 100, pctUtilidad: null,
      lineas: [
        { subRecetaId: "guiso", cantidad: 1 },
        { materiaId: "harina", cantidad: 100 },
        { insumoId: "bolsa", cantidad: 1 },
      ],
    },
    {
      id: "pan", codigo: "P2", nombre: "Pan", tipo: "PRINCIPAL", porciones: 1,
      manoObra: 0, produccionMensual: 300, pctUtilidad: 0.5,
      lineas: [{ materiaId: "harina", cantidad: 50 }],
    },
  ],
  costoUnitMateria: { carne: 0.03, harina: 0.01 },
  costoUnitInsumo: { bolsa: 0.05 },
  indirectoMensual: 400, // 400 / 400 unidades = 1 por unidad
  pctGastosAjenos: 0.125,
  pctUtilidad: 0.3,
  pctIva: 0.16,
};

test("sub-receta, prorrateo y precio", () => {
  const r = calcularEstructuras(base);
  assert.equal(r.length, 2); // las sub-recetas no se venden
  const pastel = r.find((x) => x.id === "pastel")!;
  cerca(pastel.materiaPrima, 1.5 + 1.0); // 1 porción de guiso + 100 g de harina
  cerca(pastel.insumos, 0.05);
  cerca(pastel.manoObra, 0.2);
  cerca(pastel.indirecto, 1); // igual para todos los productos
  cerca(pastel.costoTotal, 2.5 + 0.05 + 0.2 + 1);
  cerca(pastel.gastosAjenos, pastel.costoTotal * 0.125);
  cerca(pastel.precioSinIva, pastel.costoTotal * 1.125 * 1.3);
  cerca(pastel.precio, pastel.precioSinIva * 1.16);
  cerca(pastel.pctProrrateo, 0.25);
});

test("la nómina de producción se suma a la mano de obra por unidad", () => {
  // 400 unidades al mes y 200 de nómina de producción: 0.5 por unidad
  const r = calcularEstructuras({ ...base, nominaProduccionMensual: 200 });
  const pastel = r.find((x) => x.id === "pastel")!;
  cerca(pastel.manoObra, 0.2 + 0.5);
  cerca(pastel.costoTotal, 2.5 + 0.05 + 0.7 + 1);
  const pan = r.find((x) => x.id === "pan")!;
  cerca(pan.manoObra, 0.5);
});

test("utilidad propia del producto", () => {
  const pan = calcularEstructuras(base).find((x) => x.id === "pan")!;
  cerca(pan.precioSinIva, pan.costoTotal * 1.125 * 1.5);
});

test("el prorrateo suma 100 %", () => {
  const total = calcularEstructuras(base).reduce((a, x) => a + x.pctProrrateo, 0);
  cerca(total, 1);
});

test("sin producción no hay prorrateo ni división por cero", () => {
  const sinProd: Entrada = { ...base, productos: base.productos.map((p) => ({ ...p, produccionMensual: 0 })) };
  for (const x of calcularEstructuras(sinProd)) cerca(x.indirecto, 0);
});

test("detecta ciclos de sub-recetas", () => {
  const lineas = [{ productoId: "a", subRecetaId: "b" }, { productoId: "b", subRecetaId: "c" }];
  assert.equal(creaCiclo("c", "a", lineas), true); // c -> a -> b -> c
  assert.equal(creaCiclo("a", "a", lineas), true);
  assert.equal(creaCiclo("a", "c", lineas), false);
});

test("un ciclo ya guardado no cuelga el cálculo", () => {
  const ciclo: Entrada = {
    ...base,
    productos: [
      { ...base.productos[0], lineas: [{ subRecetaId: "pastel", cantidad: 1 }] },
      { ...base.productos[1], lineas: [{ subRecetaId: "guiso", cantidad: 1 }] },
    ],
  };
  assert.throws(() => calcularEstructuras(ciclo), /se usa a sí misma/);
});

import { proyectar, simularCombo, variablesYFijos } from "./costos.ts";

test("combo con descuento", () => {
  const r = simularCombo(
    [{ precioSinIva: 5, costoTotal: 3, cantidad: 2 }, { precioSinIva: 2, costoTotal: 1, cantidad: 1 }],
    0.1, 0.16,
  );
  cerca(r.costo, 7);
  cerca(r.precioLista, 12);
  cerca(r.descuento, 1.2);
  cerca(r.precioSinIva, 10.8);
  cerca(r.iva, 10.8 * 0.16);
  cerca(r.utilidad, 3.8);
  cerca(r.margen, 3.8 / 10.8);
  assert.equal(r.pierde, false);
});

test("combo con descuento excesivo pierde y el descuento se limita a 100 %", () => {
  const items = [{ precioSinIva: 5, costoTotal: 3, cantidad: 1 }];
  assert.equal(simularCombo(items, 0.5, 0.16).pierde, true);
  cerca(simularCombo(items, 5, 0.16).precioSinIva, 0);
  assert.equal(simularCombo([], 0, 0.16).pierde, false);
});

test("proyección base: utilidad = Σ unidades × (precio − costo total)", () => {
  const e = { ...base, nominaProduccionMensual: 200 };
  const est = calcularEstructuras(e);
  const { productos, fijos } = variablesYFijos(e, est);
  cerca(fijos, 400 + 200);
  const p = proyectar(productos, fijos, { pctUnidades: 0, pctPrecio: 0, pctVariable: 0, pctFijos: 0 });
  const esperado = est.reduce((s, f) => s + f.produccion * (f.precioSinIva - f.costoTotal), 0);
  cerca(p.utilidad, esperado);
});

test("proyección: escenario, punto de equilibrio y margen de seguridad", () => {
  const productos = [
    { nombre: "A", unidades: 100, precioSinIva: 10, costoVariable: 6 },
    { nombre: "B", unidades: 100, precioSinIva: 6, costoVariable: 4 },
  ];
  // contribución: 100×4 + 100×2 = 600; por unidad 3; fijos 450 → equilibrio 150 u, de 200 vendidas
  const p = proyectar(productos, 450, { pctUnidades: 0, pctPrecio: 0, pctVariable: 0, pctFijos: 0 });
  cerca(p.contribucion, 600);
  cerca(p.utilidad, 150);
  cerca(p.equilibrio!, 150);
  cerca(p.margenSeguridad!, 0.25);
  // ventas −25 % → justo en equilibrio, utilidad 0
  cerca(proyectar(productos, 450, { pctUnidades: -0.25, pctPrecio: 0, pctVariable: 0, pctFijos: 0 }).utilidad, 0);
  // precios +10 % y fijos +10 %
  const q = proyectar(productos, 450, { pctUnidades: 0, pctPrecio: 0.1, pctVariable: 0, pctFijos: 0.1 });
  cerca(q.ingresos, 1600 * 1.1);
  cerca(q.fijos, 495);
});

test("proyección sin contribución no inventa equilibrio", () => {
  const p = proyectar([{ nombre: "A", unidades: 10, precioSinIva: 1, costoVariable: 2 }], 100, { pctUnidades: 0, pctPrecio: 0, pctVariable: 0, pctFijos: 0 });
  assert.equal(p.equilibrio, null);
  assert.equal(p.margenSeguridad, null);
  assert.equal(proyectar([], 100, { pctUnidades: 0, pctPrecio: 0, pctVariable: 0, pctFijos: 0 }).equilibrio, null);
});
