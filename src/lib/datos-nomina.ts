import "server-only";
import { db } from "./db";
import {
  calcularNomina,
  contarLunes,
  paramsDelPeriodo,
  PARAMS_POR_DEFECTO,
  type ParamsNomina,
  type ResultadoNomina,
} from "./nomina";

export type FilaNomina = {
  empleado: { id: string; cedula: string; nombre: string; cargo: string; area: string };
  novedad: { horasNocturnas: number; horasExtras: number; diasFeriados: number };
  r: ResultadoNomina;
};

/** Calcula la nómina de todos los empleados activos de la empresa para un período AAAA-MM. */
export async function nominaDelPeriodo(empresaId: string, periodo: string) {
  const [anio, mes] = periodo.split("-").map(Number);
  const [lista, empleados] = await Promise.all([
    db.parametroNomina.findMany({ where: { empresaId } }),
    db.empleado.findMany({
      where: { empresaId, activo: true },
      include: { cargo: true, novedades: { where: { periodo } } },
      orderBy: { nombre: "asc" },
    }),
  ]);
  const vigente = paramsDelPeriodo(lista, periodo);
  const params: ParamsNomina = vigente ?? PARAMS_POR_DEFECTO;
  const lunes = contarLunes(anio, mes);

  const filas: FilaNomina[] = empleados.map((e) => {
    const n = e.novedades[0];
    const novedad = {
      horasNocturnas: n?.horasNocturnas ?? 0,
      horasExtras: n?.horasExtras ?? 0,
      diasFeriados: n?.diasFeriados ?? 0,
    };
    return {
      empleado: { id: e.id, cedula: e.cedula, nombre: e.nombre, cargo: e.cargo.nombre, area: e.cargo.area },
      novedad,
      r: calcularNomina(e, novedad, params, lunes),
    };
  });

  const costoArea = (area: string) =>
    filas.filter((f) => f.empleado.area === area).reduce((s, f) => s + f.r.costoEmpresa, 0);

  return {
    filas,
    params,
    usaDefecto: !vigente,
    lunes,
    costoProduccion: costoArea("PRODUCCION"),
    costoAdministracion: costoArea("ADMINISTRACION"),
  };
}
