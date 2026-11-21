"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requerirSesion } from "./session";
import { creaCiclo } from "./costos";
import type { Estado } from "./acciones-auth";

async function puedeEscribir() {
  const s = await requerirSesion();
  if (s.rol === "CONSULTA") throw new Error("Tu rol es solo de consulta");
  return s;
}

const pos = z.coerce.number().positive("Debe ser mayor que cero");
const noNeg = z.coerce.number().min(0, "No puede ser negativo");

/* ---------- Insumos (envases, servilletas…) ---------- */

export async function crearInsumo(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await puedeEscribir();
  const p = z
    .object({ nombre: z.string().trim().min(1, "Falta el nombre"), cantidad: pos, costoPresentacion: noNeg })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  try {
    await db.insumo.create({ data: { ...p.data, empresaId: empresa.id } });
  } catch {
    return { error: "Ya existe un insumo con ese nombre" };
  }
  revalidatePath("/insumos");
  return {};
}

export async function borrarInsumo(fd: FormData) {
  const { empresa } = await puedeEscribir();
  try {
    await db.insumo.deleteMany({ where: { id: String(fd.get("id")), empresaId: empresa.id } });
  } catch {
    /* se usa en una receta: se conserva */
  }
  revalidatePath("/insumos");
}

/* ---------- Costos indirectos ---------- */

export async function crearIndirecto(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await puedeEscribir();
  const p = z
    .object({
      categoria: z.enum(["ALQUILER_SERVICIO", "PERMISO", "UNIFORME", "SERVICIO_EXTERNO", "OTRO"]),
      descripcion: z.string().trim().min(1, "Falta la descripción"),
      montoMensual: noNeg,
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  await db.costoIndirecto.create({ data: { ...p.data, empresaId: empresa.id } });
  revalidatePath("/indirectos");
  return {};
}

export async function borrarIndirecto(fd: FormData) {
  const { empresa } = await puedeEscribir();
  await db.costoIndirecto.deleteMany({ where: { id: String(fd.get("id")), empresaId: empresa.id } });
  revalidatePath("/indirectos");
}

/* ---------- Activos (PPE) ---------- */

export async function crearActivo(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await puedeEscribir();
  const p = z
    .object({
      descripcion: z.string().trim().min(1, "Falta la descripción"),
      costo: pos,
      valorResidual: noNeg,
      vidaUtilMeses: z.coerce.number().int("Usa meses enteros").positive("Debe ser mayor que cero"),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  if (p.data.valorResidual > p.data.costo) return { error: "El valor residual no puede superar el costo" };
  await db.activo.create({ data: { ...p.data, empresaId: empresa.id } });
  revalidatePath("/activos");
  return {};
}

export async function borrarActivo(fd: FormData) {
  const { empresa } = await puedeEscribir();
  await db.activo.deleteMany({ where: { id: String(fd.get("id")), empresaId: empresa.id } });
  revalidatePath("/activos");
}

/* ---------- Productos y recetas ---------- */

export async function crearProducto(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await puedeEscribir();
  const p = z
    .object({
      codigo: z.string().trim().min(1, "Falta el código"),
      nombre: z.string().trim().min(1, "Falta el nombre"),
      tipo: z.enum(["PRINCIPAL", "SUBRECETA"]),
      area: z.string().trim().optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  try {
    await db.producto.create({ data: { ...p.data, area: p.data.area || null, empresaId: empresa.id } });
  } catch {
    return { error: "Ya existe un producto con ese código" };
  }
  revalidatePath("/productos");
  return {};
}

export async function guardarProducto(productoId: string, _: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await puedeEscribir();
  const p = z
    .object({
      nombre: z.string().trim().min(1, "Falta el nombre"),
      area: z.string().trim().optional(),
      porciones: pos,
      manoObra: noNeg,
      produccionMensual: noNeg,
      pctUtilidad: z.string().optional(), // vacío = usar el de la empresa
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  let pct: number | null = null;
  if (d.pctUtilidad && d.pctUtilidad.trim() !== "") {
    const n = Number(d.pctUtilidad);
    if (!Number.isFinite(n) || n < 0 || n > 1000) return { error: "Utilidad no válida" };
    pct = n / 100;
  }
  const r = await db.producto.updateMany({
    where: { id: productoId, empresaId: empresa.id },
    data: {
      nombre: d.nombre,
      area: d.area || null,
      porciones: d.porciones,
      manoObra: d.manoObra,
      produccionMensual: d.produccionMensual,
      pctUtilidad: pct,
    },
  });
  if (r.count === 0) return { error: "Producto no encontrado" };
  revalidatePath(`/productos/${productoId}`);
  revalidatePath("/productos");
  return {};
}

export async function borrarProducto(fd: FormData) {
  const { empresa } = await puedeEscribir();
  const id = String(fd.get("id"));
  // Una sub-receta usada por otro producto no se borra.
  const usos = await db.lineaReceta.count({ where: { subRecetaId: id } });
  if (usos > 0) return;
  await db.producto.deleteMany({ where: { id, empresaId: empresa.id } });
  revalidatePath("/productos");
}

export async function agregarLinea(productoId: string, _: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await puedeEscribir();
  const producto = await db.producto.findFirst({ where: { id: productoId, empresaId: empresa.id } });
  if (!producto) return { error: "Producto no encontrado" };
  const p = z
    .object({ componente: z.string().min(1, "Elige un componente"), cantidad: pos })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const [tipo, id] = p.data.componente.split(":");

  // Cada componente debe pertenecer a la misma empresa.
  if (tipo === "mp") {
    const ok = await db.materiaPrima.findFirst({ where: { id, empresaId: empresa.id } });
    if (!ok) return { error: "Materia prima no válida" };
    await db.lineaReceta.create({ data: { productoId, materiaId: id, cantidad: p.data.cantidad } });
  } else if (tipo === "in") {
    const ok = await db.insumo.findFirst({ where: { id, empresaId: empresa.id } });
    if (!ok) return { error: "Insumo no válido" };
    await db.lineaReceta.create({ data: { productoId, insumoId: id, cantidad: p.data.cantidad } });
  } else if (tipo === "sr") {
    const sub = await db.producto.findFirst({ where: { id, empresaId: empresa.id, tipo: "SUBRECETA" } });
    if (!sub) return { error: "Sub-receta no válida" };
    const lineas = await db.lineaReceta.findMany({
      where: { producto: { empresaId: empresa.id } },
      select: { productoId: true, subRecetaId: true },
    });
    if (creaCiclo(productoId, id, lineas)) return { error: "Eso crearía un ciclo entre sub-recetas" };
    await db.lineaReceta.create({ data: { productoId, subRecetaId: id, cantidad: p.data.cantidad } });
  } else {
    return { error: "Componente no válido" };
  }
  revalidatePath(`/productos/${productoId}`);
  return {};
}

export async function borrarLinea(fd: FormData) {
  const { empresa } = await puedeEscribir();
  const id = String(fd.get("id"));
  const productoId = String(fd.get("productoId"));
  await db.lineaReceta.deleteMany({ where: { id, producto: { empresaId: empresa.id } } });
  revalidatePath(`/productos/${productoId}`);
}
