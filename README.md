# Cuadre · Estructura de costos

Sistema web multiempresa para costear productos: materia prima, insumos, recetas y sub-recetas, costos
indirectos, activos, nómina (Venezuela), ventas, pagos, estados financieros básicos, simulador de combos,
proyecciones con punto de equilibrio e importación y exportación de Excel.

Pila: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Prisma y PostgreSQL (Neon).

## Desarrollo local

1. Instala dependencias: `npm install`
2. Copia `.env.example` a `.env` y completa `DATABASE_URL`, `DATABASE_URL_UNPOOLED` y `SESSION_SECRET`.
   Para desarrollo conviene una rama de desarrollo en Neon, separada de producción.
3. Crea las tablas: `npm run db:deploy`
4. Arranca: `npm run dev` y abre http://localhost:3000. Crea tu cuenta en `/registro`.

Pruebas de los cálculos (costos, nómina, finanzas, importación): `npm test`

## Despliegue (Vercel + Neon)

- En Vercel define las variables de entorno `DATABASE_URL` (con pool), `DATABASE_URL_UNPOOLED` (directa) y
  `SESSION_SECRET` (mínimo 32 caracteres aleatorios).
- El script `vercel-build` aplica las migraciones (`prisma migrate deploy`) antes de compilar.
- Cambios al modelo de datos: `npm run db:migrate` en local crea la migración; se sube con el código.

## Notas

- Las reglas de nómina (IVSS, RPE, FAOV, INCES, topes, recargos) son editables en la pantalla de
  parámetros y deben revisarse con un contador antes de usarse en producción.
- Los estados financieros son una vista gerencial, no sustituyen la contabilidad.
- El sistema trabaja hoy en una sola moneda por empresa.
