"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requerirSesion } from "./session";
import type { Estado } from "./acciones-auth";

async function puedeEscribir() {
  const s = await requerirSesion();
  if (s.rol === "CONSULTA") throw new Error("Tu rol es solo de consulta");
  return s;
}

const num = z.coerce.number().positive("Debe ser mayor que cero");

export async function guardarEmpresa(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa, rol } = await requerirSesion();
  if (rol !== "ADMIN") return { error: "Solo un administrador puede cambiar la empresa" };
  const p = z
    .object({
      razonSocial: z.string().trim().min(2, "Escribe la razón social"),
      rif: z.string().trim().optional(),
      direccion: z.string().trim().optional(),
      moneda: z.string().trim().min(1),
      tasaCambio: num,
      pctGastosAjenos: z.coerce.number().min(0).max(100),
      pctUtilidad: z.coerce.number().min(0).max(1000),
      pctIva: z.coerce.number().min(0).max(100),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  await db.empresa.update({
    where: { id: empresa.id },
    data: {
      razonSocial: d.razonSocial,
      rif: d.rif || null,
      direccion: d.direccion || null,
      moneda: d.moneda,
      tasaCambio: d.tasaCambio,
      // En pantalla se escriben como porcentaje (12,5); se guardan como fracción (0,125).
      pctGastosAjenos: d.pctGastosAjenos / 100,
      pctUtilidad: d.pctUtilidad / 100,
      pctIva: d.pctIva / 100,
    },
  });
  revalidatePath("/", "layout");
  return {};
}

export async function crearUnidad(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await puedeEscribir();
  const p = z
    .object({
      nombre: z.string().trim().min(1, "Falta el nombre"),
      abreviatura: z.string().trim().min(1, "Falta la abreviatura"),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  try {
    await db.unidadMedida.create({ data: { ...p.data, empresaId: empresa.id } });
  } catch {
    return { error: "Ya existe una unidad con ese nombre" };
  }
  revalidatePath("/unidades");
  return {};
}

export async function borrarUnidad(fd: FormData) {
  const { empresa } = await puedeEscribir();
  const id = String(fd.get("id"));
  // deleteMany con empresaId evita borrar datos de otra empresa.
  try {
    await db.unidadMedida.deleteMany({ where: { id, empresaId: empresa.id } });
  } catch {
    /* tiene materias primas asociadas: se conserva */
  }
  revalidatePath("/unidades");
}

export async function crearMateria(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await puedeEscribir();
  const p = z
    .object({
      codigo: z.string().trim().min(1, "Falta el código"),
      nombre: z.string().trim().min(1, "Falta el nombre"),
      unidadId: z.string().min(1, "Elige una unidad"),
      cantidad: num,
      costoPresentacion: z.coerce.number().min(0, "No puede ser negativo"),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const unidad = await db.unidadMedida.findFirst({
    where: { id: p.data.unidadId, empresaId: empresa.id },
  });
  if (!unidad) return { error: "Unidad no válida" };
  try {
    await db.materiaPrima.create({ data: { ...p.data, empresaId: empresa.id } });
  } catch {
    return { error: "Ya existe una materia prima con ese código" };
  }
  revalidatePath("/materia-prima");
  return {};
}

export async function borrarMateria(fd: FormData) {
  const { empresa } = await puedeEscribir();
  await db.materiaPrima.deleteMany({
    where: { id: String(fd.get("id")), empresaId: empresa.id },
  });
  revalidatePath("/materia-prima");
}
