"use server";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requerirSesion } from "./session";
import { leerMateriasPrimas } from "./importar-excel";

export type EstadoImport =
  | {
      error?: string;
      resumen?: {
        hoja: string;
        importadas: number;
        omitidas: { fila: number; motivo: string }[];
        avisos: { fila: number; texto: string }[];
        unidadesCreadas: string[];
        simulacion: boolean;
      };
    }
  | undefined;

const MAX_BYTES = 5 * 1024 * 1024;

export async function importarMateriasPrimas(_: EstadoImport, fd: FormData): Promise<EstadoImport> {
  const { empresa, rol } = await requerirSesion();
  if (rol === "CONSULTA") return { error: "Tu rol es solo de consulta" };

  const archivo = fd.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elige un archivo .xlsx" };
  if (!archivo.name.toLowerCase().endsWith(".xlsx")) return { error: "El archivo debe ser .xlsx (Excel)" };
  if (archivo.size > MAX_BYTES) return { error: "El archivo pesa más de 5 MB" };
  const simulacion = fd.get("simulacion") === "on";

  let lectura;
  try {
    lectura = await leerMateriasPrimas(Buffer.from(await archivo.arrayBuffer()));
  } catch {
    return { error: "No se pudo leer el archivo. ¿Es un .xlsx válido y sin contraseña?" };
  }
  if (lectura.hoja === null) return { error: lectura.errores[0].motivo };

  const omitidas = [...lectura.errores];
  const [existentes, unidades] = await Promise.all([
    db.materiaPrima.findMany({ where: { empresaId: empresa.id }, select: { codigo: true } }),
    db.unidadMedida.findMany({ where: { empresaId: empresa.id } }),
  ]);
  const codigos = new Set(existentes.map((e) => e.codigo.toLowerCase()));
  const nuevas = lectura.filas.filter((f) => {
    if (codigos.has(f.codigo.toLowerCase())) {
      omitidas.push({ fila: f.fila, motivo: `Ya existe una materia prima con el código ${f.codigo}` });
      return false;
    }
    return true;
  });

  const porNombre = new Map(unidades.map((u) => [u.nombre.toLowerCase(), u.id]));
  const unidadesCreadas: string[] = [];

  if (!simulacion) {
    // Todo en una transacción: si algo falla no queda una importación a medias.
    await db.$transaction(async (tx) => {
      for (const f of nuevas) {
        const clave = f.unidad.toLowerCase();
        if (!porNombre.has(clave)) {
          const u = await tx.unidadMedida.create({
            data: { empresaId: empresa.id, nombre: f.unidad, abreviatura: f.unidad.slice(0, 3).toLowerCase() },
          });
          porNombre.set(clave, u.id);
          unidadesCreadas.push(f.unidad);
        }
        await tx.materiaPrima.create({
          data: {
            empresaId: empresa.id,
            codigo: f.codigo,
            nombre: f.nombre,
            unidadId: porNombre.get(clave)!,
            cantidad: f.cantidad,
            costoPresentacion: f.costoPresentacion,
          },
        });
      }
    });
    revalidatePath("/materia-prima");
    revalidatePath("/unidades");
  } else {
    for (const f of nuevas) if (!porNombre.has(f.unidad.toLowerCase())) unidadesCreadas.push(f.unidad);
  }

  return {
    resumen: {
      hoja: lectura.hoja,
      importadas: nuevas.length,
      omitidas: omitidas.sort((a, b) => a.fila - b.fila),
      avisos: lectura.avisos,
      unidadesCreadas: [...new Set(unidadesCreadas)],
      simulacion,
    },
  };
}
