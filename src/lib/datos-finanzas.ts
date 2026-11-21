import "server-only";
import { db } from "./db";
import { rangoPeriodo, type VentaCalc } from "./finanzas";

export const aCalc = (v: {
  cantidad: number; precioUnitario: number; descuento: number; exento: boolean;
  pctIva: number; costoUnitDirecto: number; costoUnitTotal: number;
}): VentaCalc => ({
  cantidad: v.cantidad,
  precioUnitario: v.precioUnitario,
  descuento: v.descuento,
  exento: v.exento,
  pctIva: v.pctIva,
  costoUnitDirecto: v.costoUnitDirecto,
  costoUnitTotal: v.costoUnitTotal,
});

export async function ventasDelPeriodo(empresaId: string, periodo: string) {
  const { desde, hasta } = rangoPeriodo(periodo);
  return db.venta.findMany({
    where: { empresaId, fecha: { gte: desde, lt: hasta } },
    include: { producto: true },
    orderBy: { fecha: "desc" },
  });
}

export async function pagosDelPeriodo(empresaId: string, periodo: string) {
  const { desde, hasta } = rangoPeriodo(periodo);
  return db.pago.findMany({
    where: { empresaId, fecha: { gte: desde, lt: hasta } },
    include: { indirecto: true },
    orderBy: { fecha: "desc" },
  });
}
