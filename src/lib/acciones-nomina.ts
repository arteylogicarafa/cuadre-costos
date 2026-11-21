"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requerirSesion } from "./session";
import { periodoValido } from "./nomina";
import type { Estado } from "./acciones-auth";

/** La nómina tiene sueldos de personas: el rol de solo consulta no entra. */
async function nominaEscribe() {
  const s = await requerirSesion();
  if (s.rol === "CONSULTA") throw new Error("Tu rol no tiene acceso a la nómina");
  return s;
}

const noNeg = z.coerce.number().min(0, "No puede ser negativo");
const pos = z.coerce.number().positive("Debe ser mayor que cero");
const pct = z.coerce.number().min(0, "No puede ser negativo").max(100, "Máximo 100 %");

export async function guardarParametros(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa, rol } = await nominaEscribe();
  if (rol !== "ADMIN") return { error: "Solo un administrador puede cambiar los parámetros" };
  const p = z
    .object({
      vigenciaDesde: z.string().refine(periodoValido, "Período no válido (AAAA-MM)"),
      salarioMinimo: pos,
      bonoAlimentacion: noNeg,
      pctRiesgoIvss: pct,
      pctIvssTrab: pct,
      pctRpeTrab: pct,
      pctRpePatrono: pct,
      pctFaovTrab: pct,
      pctFaovPatrono: pct,
      pctIncesTrab: pct,
      pctIncesPatrono: pct,
      topeIvssSm: pos,
      topeRpeSm: pos,
      diasUtilidades: z.coerce.number().min(0).max(365),
      diasBonoVacMes: z.coerce.number().min(0).max(31),
      horasJornada: pos,
      recargoNocturno: pos,
      recargoExtra: pos,
      diasMes: pos,
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  const data = {
    salarioMinimo: d.salarioMinimo,
    bonoAlimentacion: d.bonoAlimentacion,
    // en pantalla son porcentajes; se guardan como fracciones
    pctRiesgoIvss: d.pctRiesgoIvss / 100,
    pctIvssTrab: d.pctIvssTrab / 100,
    pctRpeTrab: d.pctRpeTrab / 100,
    pctRpePatrono: d.pctRpePatrono / 100,
    pctFaovTrab: d.pctFaovTrab / 100,
    pctFaovPatrono: d.pctFaovPatrono / 100,
    pctIncesTrab: d.pctIncesTrab / 100,
    pctIncesPatrono: d.pctIncesPatrono / 100,
    topeIvssSm: d.topeIvssSm,
    topeRpeSm: d.topeRpeSm,
    diasUtilidades: d.diasUtilidades,
    diasBonoVacMes: d.diasBonoVacMes,
    horasJornada: d.horasJornada,
    recargoNocturno: d.recargoNocturno,
    recargoExtra: d.recargoExtra,
    diasMes: d.diasMes,
  };
  await db.parametroNomina.upsert({
    where: { empresaId_vigenciaDesde: { empresaId: empresa.id, vigenciaDesde: d.vigenciaDesde } },
    create: { ...data, empresaId: empresa.id, vigenciaDesde: d.vigenciaDesde },
    update: data,
  });
  revalidatePath("/nomina", "layout");
  revalidatePath("/informes/estructura");
  return {};
}

export async function crearCargo(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await nominaEscribe();
  const p = z
    .object({ nombre: z.string().trim().min(1, "Falta el nombre"), area: z.enum(["PRODUCCION", "ADMINISTRACION"]) })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  try {
    await db.cargo.create({ data: { ...p.data, empresaId: empresa.id } });
  } catch {
    return { error: "Ya existe un cargo con ese nombre" };
  }
  revalidatePath("/nomina/empleados");
  return {};
}

export async function borrarCargo(fd: FormData) {
  const { empresa } = await nominaEscribe();
  try {
    await db.cargo.deleteMany({ where: { id: String(fd.get("id")), empresaId: empresa.id } });
  } catch {
    /* tiene empleados: se conserva */
  }
  revalidatePath("/nomina/empleados");
}

export async function crearEmpleado(_: Estado, fd: FormData): Promise<Estado> {
  const { empresa } = await nominaEscribe();
  const p = z
    .object({
      cedula: z.string().trim().min(1, "Falta la cédula"),
      nombre: z.string().trim().min(2, "Falta el nombre"),
      cargoId: z.string().min(1, "Elige un cargo"),
      fechaIngreso: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Fecha no válida"),
      salarioMensual: pos,
      bonoFijo: noNeg,
      comision: noNeg,
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const cargo = await db.cargo.findFirst({ where: { id: p.data.cargoId, empresaId: empresa.id } });
  if (!cargo) return { error: "Cargo no válido" };
  try {
    await db.empleado.create({
      data: { ...p.data, fechaIngreso: new Date(p.data.fechaIngreso), empresaId: empresa.id },
    });
  } catch {
    return { error: "Ya existe un empleado con esa cédula" };
  }
  revalidatePath("/nomina/empleados");
  return {};
}

export async function alternarEmpleado(fd: FormData) {
  const { empresa } = await nominaEscribe();
  const id = String(fd.get("id"));
  const e = await db.empleado.findFirst({ where: { id, empresaId: empresa.id } });
  if (e) await db.empleado.update({ where: { id }, data: { activo: !e.activo } });
  revalidatePath("/nomina/empleados");
}

export async function guardarNovedad(fd: FormData) {
  const { empresa } = await nominaEscribe();
  const p = z
    .object({
      empleadoId: z.string().min(1),
      periodo: z.string().refine(periodoValido),
      horasNocturnas: noNeg,
      horasExtras: noNeg,
      diasFeriados: noNeg,
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return;
  const e = await db.empleado.findFirst({ where: { id: p.data.empleadoId, empresaId: empresa.id } });
  if (!e) return;
  const { empleadoId, periodo, ...vals } = p.data;
  await db.novedad.upsert({
    where: { empleadoId_periodo: { empleadoId, periodo } },
    create: { empleadoId, periodo, ...vals },
    update: vals,
  });
  revalidatePath("/nomina/calculo");
  revalidatePath("/informes/estructura");
}
