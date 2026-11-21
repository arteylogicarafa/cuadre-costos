"use server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "./db";
import { crearSesion, cerrarSesion } from "./session";

export type Estado = { error?: string } | undefined;

const registroSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre"),
  correo: z.string().trim().toLowerCase().email("Correo inválido"),
  clave: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  razonSocial: z.string().trim().min(2, "Escribe la razón social"),
  rif: z.string().trim().optional(),
});

export async function registrar(_: Estado, fd: FormData): Promise<Estado> {
  const p = registroSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  if (await db.usuario.findUnique({ where: { correo: d.correo } }))
    return { error: "Ese correo ya está registrado" };

  const usuario = await db.usuario.create({
    data: {
      nombre: d.nombre,
      correo: d.correo,
      claveHash: await bcrypt.hash(d.clave, 12),
      membresias: {
        create: {
          rol: "ADMIN",
          empresa: {
            create: {
              razonSocial: d.razonSocial,
              rif: d.rif || null,
              unidades: {
                create: [
                  { nombre: "Gramos", abreviatura: "g" },
                  { nombre: "Kilo", abreviatura: "kg" },
                  { nombre: "Mililitros", abreviatura: "ml" },
                  { nombre: "Litro", abreviatura: "L" },
                  { nombre: "Unidad", abreviatura: "und" },
                ],
              },
            },
          },
        },
      },
    },
    include: { membresias: true },
  });
  await crearSesion(usuario.id, usuario.membresias[0].empresaId);
  redirect("/");
}

export async function entrar(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") ?? "").trim().toLowerCase();
  const clave = String(fd.get("clave") ?? "");
  const usuario = await db.usuario.findUnique({
    where: { correo },
    include: { membresias: true },
  });
  // Mismo mensaje si falla el correo o la clave, para no revelar qué correos existen.
  if (!usuario || !(await bcrypt.compare(clave, usuario.claveHash)))
    return { error: "Correo o contraseña incorrectos" };
  if (!usuario.membresias[0]) return { error: "Tu usuario no tiene empresa asignada" };
  await crearSesion(usuario.id, usuario.membresias[0].empresaId);
  redirect("/");
}

export async function salir() {
  await cerrarSesion();
  redirect("/login");
}
