// Lectura de materia prima desde un archivo .xlsx (plantilla propia o una hoja "Centro de Costos" de una hoja de alimentos).
// Solo lee valores: nunca ejecuta macros ni fórmulas (usa el resultado guardado en la celda).
import ExcelJS from "exceljs";

export type FilaImport = {
  fila: number;
  codigo: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  costoPresentacion: number;
};

export type ResultadoLectura = {
  hoja: string | null;
  filas: FilaImport[];
  errores: { fila: number; motivo: string }[];
  avisos: { fila: number; texto: string }[];
};

export const MAX_FILAS = 2000;

const norm = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/** Valor "visible" de una celda: resultado de la fórmula, texto plano o número. */
export function valorCelda(v: unknown): string | number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("result" in o) return valorCelda(o.result);
    if (Array.isArray(o.richText)) return (o.richText as { text: string }[]).map((t) => t.text).join("");
    if ("text" in o) return String(o.text);
    if ("error" in o) return null;
  }
  return null;
}

const aNumero = (v: string | number | null) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  if (typeof v === "string" && v.trim() !== "") return Number(v.replace(",", "."));
  return NaN;
};

type Columnas = { codigo: number; nombre: number; unidad: number; cantidad: number; costo: number };

/** Busca en las primeras filas una cabecera con código, nombre, unidad, cantidad y costo de presentación. */
function buscarCabecera(ws: ExcelJS.Worksheet): { fila: number; col: Columnas } | null {
  const limite = Math.min(ws.rowCount, 30);
  for (let r = 1; r <= limite; r++) {
    const row = ws.getRow(r);
    const col: Partial<Columnas> = {};
    row.eachCell({ includeEmpty: false }, (cell, c) => {
      const t = norm(valorCelda(cell.value));
      // Se toma la primera aparición de cada nombre (a la izquierda), por si hay varias tablas en la fila.
      if (col.codigo === undefined && (t === "codigo" || t === "cod")) col.codigo = c;
      else if (col.nombre === undefined && ["nombre", "producto", "materia prima", "descripcion"].includes(t)) col.nombre = c;
      else if (col.unidad === undefined && ["unidad", "unidad de medida", "presentacion"].includes(t)) col.unidad = c;
      else if (col.cantidad === undefined && t === "cantidad") col.cantidad = c;
      else if (col.costo === undefined && /^costo (de la )?presentacion$/.test(t)) col.costo = c;
    });
    if (col.codigo && col.nombre && col.unidad && col.cantidad && col.costo) return { fila: r, col: col as Columnas };
  }
  return null;
}

export async function leerMateriasPrimas(datos: ArrayBuffer | Buffer): Promise<ResultadoLectura> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(datos as ArrayBuffer);

  for (const ws of wb.worksheets) {
    const cab = buscarCabecera(ws);
    if (!cab) continue;

    const filas: FilaImport[] = [];
    const errores: ResultadoLectura["errores"] = [];
    const avisos: ResultadoLectura["avisos"] = [];
    const vistos = new Set<string>();
    const fin = Math.min(ws.rowCount, cab.fila + MAX_FILAS);

    for (let r = cab.fila + 1; r <= fin; r++) {
      const row = ws.getRow(r);
      const get = (c: number) => valorCelda(row.getCell(c).value);
      const codigo = String(get(cab.col.codigo) ?? "").trim();
      const nombre = String(get(cab.col.nombre) ?? "").trim();
      const unidad = String(get(cab.col.unidad) ?? "").trim();
      if (!codigo && !nombre) continue; // fila vacía

      if (!codigo) { errores.push({ fila: r, motivo: "Falta el código" }); continue; }
      if (!nombre) { errores.push({ fila: r, motivo: `Falta el nombre (código ${codigo})` }); continue; }
      if (!unidad) { errores.push({ fila: r, motivo: `Falta la unidad (${codigo})` }); continue; }
      const cantidad = aNumero(get(cab.col.cantidad));
      const costo = aNumero(get(cab.col.costo));
      if (!(cantidad > 0)) { errores.push({ fila: r, motivo: `Cantidad no válida (${codigo})` }); continue; }
      if (get(cab.col.costo) === null || get(cab.col.costo) === "") { errores.push({ fila: r, motivo: `Falta el costo (${codigo})` }); continue; }
      if (!(costo >= 0)) { errores.push({ fila: r, motivo: `Costo no válido (${codigo})` }); continue; }
      if (vistos.has(codigo.toLowerCase())) { errores.push({ fila: r, motivo: `Código repetido en el archivo (${codigo})` }); continue; }
      vistos.add(codigo.toLowerCase());

      // Avisos de datos que parecen errores de carga (no impiden importar).
      const u = norm(unidad);
      const porUnidad = costo / cantidad;
      if ((u.startsWith("gram") || u.startsWith("mili")) && porUnidad >= 1)
        avisos.push({ fila: r, texto: `${nombre}: cuesta ${porUnidad.toFixed(2)} por ${u.startsWith("gram") ? "gramo" : "mililitro"}. ¿La cantidad es correcta?` });
      if (cantidad === 1 && (u.startsWith("gram") || u.startsWith("mili")))
        avisos.push({ fila: r, texto: `${nombre}: la presentación es de 1 ${u.startsWith("gram") ? "gramo" : "mililitro"}.` });
      if (/^(de |en |con |y )/i.test(nombre) || nombre.length < 3)
        avisos.push({ fila: r, texto: `El nombre "${nombre}" parece incompleto.` });

      filas.push({ fila: r, codigo, nombre, unidad, cantidad, costoPresentacion: costo });
    }
    return { hoja: ws.name, filas, errores, avisos };
  }
  return {
    hoja: null,
    filas: [],
    errores: [{ fila: 0, motivo: "No se encontró una tabla con las columnas: Código, Nombre (o Producto), Unidad (o Presentación), Cantidad y Costo presentación." }],
    avisos: [],
  };
}
