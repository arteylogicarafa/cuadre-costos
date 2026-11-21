"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requerirSesion } from "./session";
import { cargarEntrada } from "./datos-costos";
import { calcularEstructuras } from "./costos";
import { periodoValido } from "./nomina";
import type { Estado } from "./acciones-auth";

async function puedeEscribir() {
  const s = await requerirSesion();
  if (s.rol === "CONSULTA") throw new Error("Tu rol es solo de consulta");
  return s;
}

const pos = z.coerce.number().positive("Debe ser mayor que cero");
const noNeg = z.coerce.number().min(0, "No puede ser negativo");
const fecha = z.string().refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)), "Fecha no válida");

/* ---------- Ventas ---------- */

export async function registrarVenta(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await puedeEscribir();
  const p = z
    .object({
      fecha,
      productoId: z.string().min(1, "Elige un producto"),
      cantidad: pos,
      precioUnitario: z.string().optional(), // vacío = precio calculado de la estructura de costos
      descuento: noNeg,
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;

  const producto = await db.producto.findFirst({
    where: { id: d.productoId, empresaId: empresa.id, tipo: "PRINCIPAL" },
  });
  if (!producto) return { error: "Producto no válido" };

  let estructura;
  try {
    estructura = calcularEstructuras(await cargarEntrada(empresa)).find((x) => x.id === producto.id);
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!estructura) return { error: "No se pudo calcular el costo del producto" };

  let precio = estructura.precioSinIva;
  if (d.precioUnitario && d.precioUnitario.trim() !== "") {
    precio = Number(d.precioUnitario);
    if (!Number.isFinite(precio) || precio < 0) return { error: "Precio no válido" };
  }

  await db.venta.create({
    data: {
      empresaId: empresa.id,
      fecha: new Date(d.fecha),
      productoId: producto.id,
      cantidad: d.cantidad,
      precioUnitario: precio,
      descuento: d.descuento,
      exento: fd.get("exento") === "on",
      pctIva: empresa.pctIva,
      // El costo queda fijo al momento de la venta.
      costoUnitDirecto: estructura.directo,
      costoUnitTotal: estructura.costoTotal,
    },
  });
  revalidatePath("/ventas");
  revalidatePath("/finanzas", "layout");
  return {};
}

export async function borrarVenta(fd: FormData) {
  const { empresa } = await puedeEscribir();
  await db.venta.deleteMany({ where: { id: String(fd.get("id")), empresaId: empresa.id } });
  revalidatePath("/ventas");
  revalidatePath("/finanzas", "layout");
}

/* ---------- Pagos ---------- */

export async function registrarPago(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await puedeEscribir();
  const p = z
    .object({
      fecha,
      categoria: z.enum(["ALQUILER_SERVICIO", "PERMISO", "UNIFORME", "SERVICIO_EXTERNO", "NOMINA_ADMIN", "OTRO"]),
      concepto: z.string().trim().min(1, "Falta el concepto"),
      monto: pos,
      medio: z.enum(["EFECTIVO", "TRANSFERENCIA", "OTRO"]),
      comprobante: z.string().trim().optional(),
      indirectoId: z.string().optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  if (d.indirectoId) {
    const ok = await db.costoIndirecto.findFirst({ where: { id: d.indirectoId, empresaId: empresa.id } });
    if (!ok) return { error: "Costo indirecto no válido" };
  }
  await db.pago.create({
    data: {
      empresaId: empresa.id,
      fecha: new Date(d.fecha),
      categoria: d.categoria,
      concepto: d.concepto,
      monto: d.monto,
      medio: d.medio,
      comprobante: d.comprobante || null,
      indirectoId: d.indirectoId || null,
    },
  });
  revalidatePath("/pagos");
  revalidatePath("/finanzas", "layout");
  return {};
}

export async function borrarPago(fd: FormData) {
  const { empresa } = await puedeEscribir();
  await db.pago.deleteMany({ where: { id: String(fd.get("id")), empresaId: empresa.id } });
  revalidatePath("/pagos");
  revalidatePath("/finanzas", "layout");
}

/* ---------- Estado de situación (balance cargado a mano) ---------- */

export async function crearCuenta(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await puedeEscribir();
  const p = z
    .object({ nombre: z.string().trim().min(1, "Falta el nombre"), tipo: z.enum(["ACTIVO", "PASIVO", "PATRIMONIO"]) })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  try {
    await db.cuentaContable.create({ data: { ...p.data, empresaId: empresa.id } });
  } catch {
    return { error: "Ya existe una cuenta con ese nombre" };
  }
  revalidatePath("/finanzas/situacion");
  return {};
}

export async function borrarCuenta(fd: FormData) {
  const { empresa } = await puedeEscribir();
  await db.cuentaContable.deleteMany({ where: { id: String(fd.get("id")), empresaId: empresa.id } });
  revalidatePath("/finanzas/situacion");
}

export async function guardarSaldo(fd: FormData) {
  const { empresa } = await puedeEscribir();
  const p = z
    .object({
      cuentaId: z.string().min(1),
      periodo: z.string().refine(periodoValido),
      monto: z.coerce.number().finite(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return;
  const cuenta = await db.cuentaContable.findFirst({ where: { id: p.data.cuentaId, empresaId: empresa.id } });
  if (!cuenta) return;
  await db.saldoCuenta.upsert({
    where: { cuentaId_periodo: { cuentaId: p.data.cuentaId, periodo: p.data.periodo } },
    create: p.data,
    update: { monto: p.data.monto },
  });
  revalidatePath("/finanzas/situacion");
}
