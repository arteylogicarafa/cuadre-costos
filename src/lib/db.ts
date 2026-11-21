import { PrismaClient } from "@prisma/client";

/**
 * Neon entrega dos cadenas: DATABASE_URL (con pool, host con "-pooler") para la aplicación y
 * DATABASE_URL_UNPOOLED (directa) para migraciones. Se usa tal cual viene: medimos que agregarle
 * `pgbouncer=true` multiplica por cinco la latencia de cada consulta y el pool de Neon ya soporta Prisma.
 */
const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;
