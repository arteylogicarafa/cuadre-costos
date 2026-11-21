import test from "node:test";
import assert from "node:assert/strict";
import {
  calcularNomina,
  contarLunes,
  paramsDelPeriodo,
  periodoValido,
  PARAMS_POR_DEFECTO as P,
} from "./nomina.ts";

const cerca = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);

// Caso de la hoja de nómina de referencia: Gerente General, sueldo 500, bonos 40, comisiones 35, 5 lunes.
const gerente = { salarioMensual: 500, bonoFijo: 40, comision: 35 };
const sinNovedades = { horasNocturnas: 0, horasExtras: 0, diasFeriados: 0 };

test("coincide con la hoja de referencia (valores de la fila del Gerente General)", () => {
  const r = calcularNomina(gerente, sinNovedades, P, 5);
  cerca(r.alicuotaUtilidades, 41.666666666666664); // Y35
  cerca(r.alicuotaBonoVacacional, 33.333333333333336); // AA35
  cerca(r.salarioIntegral, 650); // AC35
  cerca(r.ivssTrab, 23.07692307692308); // AF35
  cerca(r.ivssPatrono, 51.923076923076927); // AG35
  cerca(r.rpeTrab, 2.884615384615385); // AH35
  cerca(r.rpePatrono, 11.53846153846154); // AI35
  cerca(r.faovTrab, 6.5); // AJ35
  cerca(r.faovPatrono, 13); // AK35
});

test("el costo para la empresa suma pagos, alícuotas y aportes patronales", () => {
  const r = calcularNomina(gerente, sinNovedades, P, 5);
  const esperado = 500 + 40 + 45 + 35 + 41.666666666666664 + 33.333333333333336 + r.ivssPatrono + r.rpePatrono + r.faovPatrono + r.incesPatrono;
  cerca(r.costoEmpresa, esperado);
  assert.ok(r.costoEmpresa > r.neto);
});

test("horas nocturnas, extras y feriados", () => {
  const r = calcularNomina({ salarioMensual: 240, bonoFijo: 0, comision: 0 }, { horasNocturnas: 8, horasExtras: 4, diasFeriados: 1 }, P, 4);
  // diario 8, por hora 1
  cerca(r.bonoNocturno, 1 * 1.3 * 8);
  cerca(r.horasExtras, 1 * 1.5 * 4);
  cerca(r.feriados, 8 * 1.5 * 1);
});

test("el IVSS respeta el tope de 5 salarios mínimos", () => {
  const alto = calcularNomina({ salarioMensual: 5000, bonoFijo: 0, comision: 0 }, sinNovedades, P, 4);
  const tope = calcularNomina({ salarioMensual: 650, bonoFijo: 0, comision: 0 }, sinNovedades, P, 4);
  cerca(alto.ivssTrab, tope.ivssTrab); // 5 × 130 = 650
});

test("contar lunes de un mes", () => {
  assert.equal(contarLunes(2026, 11), 5); // 2, 9, 16, 23 y 30 de noviembre de 2026
  assert.equal(contarLunes(2026, 6), 5); // 1, 8, 15, 22 y 29 de junio de 2026
  assert.equal(contarLunes(2026, 2), 4); // febrero de 2026 (28 días) tiene 4 lunes
});

test("parámetros por vigencia", () => {
  const lista = [{ vigenciaDesde: "2026-01" }, { vigenciaDesde: "2026-05" }, { vigenciaDesde: "2026-09" }];
  assert.equal(paramsDelPeriodo(lista, "2025-12"), null);
  assert.equal(paramsDelPeriodo(lista, "2026-04")?.vigenciaDesde, "2026-01");
  assert.equal(paramsDelPeriodo(lista, "2026-05")?.vigenciaDesde, "2026-05");
  assert.equal(paramsDelPeriodo(lista, "2026-12")?.vigenciaDesde, "2026-09");
});

test("validar período", () => {
  assert.equal(periodoValido("2026-11"), true);
  assert.equal(periodoValido("2026-13"), false);
  assert.equal(periodoValido("26-11"), false);
  assert.equal(periodoValido(undefined), false);
});
