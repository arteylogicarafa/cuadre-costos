import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const COOKIE = "sesion";
// En producción exigimos una clave larga: con una corta o ausente las sesiones se podrían falsificar.
const key = () => {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto) throw new Error("Falta la variable SESSION_SECRET");
  if (process.env.NODE_ENV === "production" && secreto.length < 32)
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres en producción");
  return new TextEncoder().encode(secreto);
};

export async function crearSesion(usuarioId: string, empresaId: string | null) {
  const token = await new SignJWT({ usuarioId, empresaId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

/** Igual que requerirSesion, pero el rol de solo consulta no puede ver sueldos. */
export async function requerirNomina() {
  const s = await requerirSesion();
  if (s.rol === "CONSULTA") redirect("/");
  return s;
}

/** Lee la sesión y verifica contra la base de datos que el usuario y la membresía siguen existiendo. */
export async function requerirSesion() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) redirect("/login");
  let payload: { usuarioId: string; empresaId: string | null };
  try {
    payload = (await jwtVerify(token, key())).payload as typeof payload;
  } catch {
    redirect("/login");
  }
  const usuario = await db.usuario.findUnique({ where: { id: payload.usuarioId } });
  if (!usuario) redirect("/login");
  const membresia = payload.empresaId
    ? await db.membresia.findUnique({
        where: {
          usuarioId_empresaId: { usuarioId: usuario.id, empresaId: payload.empresaId },
        },
        include: { empresa: true },
      })
    : null;
  if (!membresia) redirect("/login");
  return { usuario, empresa: membresia.empresa, rol: membresia.rol };
}
