import "server-only";
import ExcelJS from "exceljs";

export type Columna = { titulo: string; ancho?: number; formato?: "texto" | "numero" | "porcentaje" };

/** Genera un .xlsx con una hoja: título, columnas con formato y filas. Los textos se guardan como texto (no fórmulas). */
export async function crearLibro(
  hoja: string,
  titulo: string,
  columnas: Columna[],
  filas: (string | number | null)[][],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();
  const ws = wb.addWorksheet(hoja.slice(0, 31));

  ws.addRow([titulo]).font = { bold: true, size: 14 };
  ws.addRow([]);
  const cab = ws.addRow(columnas.map((c) => c.titulo));
  cab.font = { bold: true };
  cab.alignment = { vertical: "middle", wrapText: true };
  cab.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E5E4" } };
    c.border = { bottom: { style: "thin" } };
  });

  columnas.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    col.width = c.ancho ?? 16;
    if (c.formato === "numero") col.numFmt = "#,##0.00##";
    if (c.formato === "porcentaje") col.numFmt = "0.00%";
  });

  for (const f of filas) ws.addRow(f);
  ws.views = [{ state: "frozen", ySplit: 3 }];
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function respuestaXlsx(datos: Buffer, nombre: string) {
  return new Response(new Uint8Array(datos), {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
