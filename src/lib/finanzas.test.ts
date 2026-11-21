import test from "node:test";
import assert from "node:assert/strict";
import {
  calcularResultados,
  calcularSituacion,
  calcularVenta,
  periodoDeFecha,
  rangoPeriodo,
  resumirPorProducto,
  ultimosPeriodos,
  type VentaCalc,
} from "./finanzas.ts";

const cerca = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

const v: VentaCalc = {
  cantidad: 10, precioUnitario: 5, descuento: 5, exento: false, pctIva: 0.16,
  costoUnitDirecto: 2, costoUnitTotal: 3,
};

test("venta con descuento e IVA", () => {
  const r = calcularVenta(v);
  cerca(r.bruto, 50);
  cerca(r.base, 45);
  cerca(r.iva, 7.2);
  cerca(r.total, 52.2);
  cerca(r.costoDirecto, 20);
  cerca(r.costoTotal, 30);
  cerca(r.utilidad, 15);
  cerca(r.pctUtilidad, 0.5);
});

test("venta exenta no lleva IVA", () => {
  const r = calcularVenta({ ...v, exento: true });
  cerca(r.iva, 0);
  cerca(r.total, 45);
});

test("el descuento no puede dejar la base negativa", () => {
  cerca(calcularVenta({ ...v, descuento: 999 }).base, 0);
});

test("costo cero no divide por cero", () => {
  cerca(calcularVenta({ ...v, costoUnitTotal: 0 }).pctUtilidad, 0);
});

test("relación por producto suma ventas del mismo producto", () => {
  const filas = resumirPorProducto([
    { productoId: "a", nombre: "A", venta: v },
    { productoId: "a", nombre: "A", venta: v },
    { productoId: "b", nombre: "B", venta: { ...v, cantidad: 1 } },
  ]);
  assert.equal(filas.length, 2);
  assert.equal(filas[0].productoId, "a"); // ordenado por base vendida
  cerca(filas[0].cantidad, 20);
  cerca(filas[0].base, 90);
  cerca(filas[0].utilidad, 30);
  cerca(filas[0].pctUtilidad, 0.5);
});

test("estado de resultados: costo directo en ventas y gastos aparte", () => {
  const r = calcularResultados([v], 6);
  cerca(r.ingresos, 45);
  cerca(r.costoVentas, 20);
  cerca(r.utilidadBruta, 25);
  cerca(r.utilidadNeta, 19);
  cerca(r.margenBruto, 25 / 45);
  cerca(r.margenNeto, 19 / 45);
});

test("sin ventas los márgenes son cero y los gastos dan pérdida", () => {
  const r = calcularResultados([], 100);
  cerca(r.utilidadNeta, -100);
  cerca(r.margenNeto, 0);
});

test("balance cuadra o muestra la diferencia", () => {
  const ok = calcularSituacion([
    { tipo: "ACTIVO", monto: 100 }, { tipo: "PASIVO", monto: 40 }, { tipo: "PATRIMONIO", monto: 60 },
  ]);
  assert.equal(ok.cuadra, true);
  const mal = calcularSituacion([{ tipo: "ACTIVO", monto: 100 }, { tipo: "PASIVO", monto: 40 }]);
  assert.equal(mal.cuadra, false);
  cerca(mal.diferencia, 60);
});

test("períodos: rango, últimos meses y paso de año", () => {
  const r = rangoPeriodo("2026-12");
  assert.equal(r.desde.toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(r.hasta.toISOString(), "2027-01-01T00:00:00.000Z");
  assert.deepEqual(ultimosPeriodos("2026-02", 4), ["2025-11", "2025-12", "2026-01", "2026-02"]);
  assert.equal(periodoDeFecha(new Date("2026-11-30")), "2026-11");
});
