import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { leerMateriasPrimas, valorCelda } from "./importar-excel.ts";

async function libro(
  filas: unknown[][],
  nombreHoja = "Hoja1",
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(nombreHoja);
  filas.forEach((f) => ws.addRow(f));
  return Buffer.from(await wb.xlsx.writeBuffer());
}

const CAB = ["Código", "Nombre", "Unidad", "Cantidad", "Costo presentación"];

test("lee filas válidas y usa el resultado de las fórmulas", async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("MP");
  ws.addRow(CAB);
  ws.addRow(["MP01", "Carne", "Gramos", 1000, 30]);
  ws.addRow(["MP03", "Arroz", "Gramos", 900, { formula: "105.29/40", result: 2.63225 }]);
  const r = await leerMateriasPrimas(Buffer.from(await wb.xlsx.writeBuffer()));
  assert.equal(r.hoja, "MP");
  assert.equal(r.filas.length, 2);
  assert.equal(r.filas[1].costoPresentacion, 2.63225);
  assert.equal(r.errores.length, 0);
});

test("encuentra la cabecera aunque no esté en la primera fila y con columnas extra", async () => {
  const r = await leerMateriasPrimas(
    await libro([
      ["Lista de precios"],
      [],
      ["PRODUCTO", "CODIGO", "TIPO", "PRESENTACIÓN", "CANTIDAD", "COSTO PRESENTACIÓN", "COSTO UNITARIO"],
      ["CARNE", "MP01", "PRINCIPAL", "Gramos", 1000, 30, 0.03],
    ]),
  );
  assert.equal(r.filas.length, 1);
  assert.deepEqual(
    { c: r.filas[0].codigo, n: r.filas[0].nombre, u: r.filas[0].unidad, q: r.filas[0].cantidad, p: r.filas[0].costoPresentacion },
    { c: "MP01", n: "CARNE", u: "Gramos", q: 1000, p: 30 },
  );
});

test("con dos tablas en la misma fila toma la primera (izquierda)", async () => {
  const r = await leerMateriasPrimas(
    await libro([
      ["PRODUCTO", "CODIGO", "PRESENTACIÓN", "CANTIDAD", "COSTO PRESENTACIÓN", "", "INSUMOS", "PRESENTACIÓN", "CANTIDAD", "COSTO PRESENTACIÓN"],
      ["CARNE", "MP01", "Gramos", 1000, 30, "", "BOLSA", "Unidad", 500, 5],
    ]),
  );
  assert.equal(r.filas.length, 1);
  assert.equal(r.filas[0].nombre, "CARNE");
});

test("rechaza filas inválidas con el motivo y número de fila", async () => {
  const r = await leerMateriasPrimas(
    await libro([
      CAB,
      ["MP01", "Carne", "Gramos", 1000, 30],
      ["MP01", "Carne otra vez", "Gramos", 1000, 30], // repetido
      ["", "Sin código", "Gramos", 1, 1],
      ["MP05", "Cantidad cero", "Gramos", 0, 5],
      ["MP06", "Costo negativo", "Gramos", 10, -1],
      ["MP07", "Sin unidad", "", 10, 1],
      [],
      ["MP08", "Cantidad con coma", "Kilo", "2,5", 10],
    ]),
  );
  assert.deepEqual(r.filas.map((f) => f.codigo), ["MP01", "MP08"]);
  assert.equal(r.filas[1].cantidad, 2.5);
  assert.equal(r.errores.length, 5);
  assert.match(r.errores[0].motivo, /repetido/i);
  assert.equal(r.errores[0].fila, 3);
});

test("avisa de datos sospechosos pero los importa", async () => {
  const r = await leerMateriasPrimas(
    await libro([
      CAB,
      ["MP08", "COMINO", "Gramos", 1, 1], // 1 por gramo y presentación de 1 g
      ["MP24", "DE GUAYABA", "Gramos", 1000, 4], // nombre incompleto
    ]),
  );
  assert.equal(r.filas.length, 2);
  assert.ok(r.avisos.some((a) => /COMINO/.test(a.texto)));
  assert.ok(r.avisos.some((a) => /incompleto/.test(a.texto)));
});

test("sin cabecera reconocible devuelve un error claro", async () => {
  const r = await leerMateriasPrimas(await libro([["a", "b"], [1, 2]]));
  assert.equal(r.hoja, null);
  assert.equal(r.filas.length, 0);
  assert.match(r.errores[0].motivo, /No se encontró/);
});

test("valorCelda maneja texto enriquecido, errores y nulos", () => {
  assert.equal(valorCelda({ richText: [{ text: "a" }, { text: "b" }] }), "ab");
  assert.equal(valorCelda({ error: "#REF!" }), null);
  assert.equal(valorCelda(null), null);
  assert.equal(valorCelda({ formula: "1+1", result: 2 }), 2);
});
