import { requerirSesion } from "@/lib/session";
import { crearLibro, respuestaXlsx } from "@/lib/libro-excel";

export async function GET() {
  await requerirSesion();
  // La cabecera debe quedar en la fila 3 de la hoja; el lector busca la cabecera donde esté.
  const libro = await crearLibro(
    "Materia prima",
    "Plantilla de materia prima",
    [
      { titulo: "Código", ancho: 12 },
      { titulo: "Nombre", ancho: 30 },
      { titulo: "Unidad", ancho: 14 },
      { titulo: "Cantidad", ancho: 12, formato: "numero" },
      { titulo: "Costo presentación", ancho: 20, formato: "numero" },
    ],
    [
      ["MP01", "Carne", "Gramos", 1000, 30],
      ["MP02", "Leche", "Mililitros", 1000, 1.5],
    ],
  );
  return respuestaXlsx(libro, "plantilla-materia-prima.xlsx");
}
