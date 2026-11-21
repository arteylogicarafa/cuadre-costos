// Motor de nómina mensual. Replica las fórmulas de una hoja de nómina de referencia,
// con parámetros editables y calculado por período (no depende de la fecha de hoy).

export type ParamsNomina = {
  salarioMinimo: number;
  bonoAlimentacion: number;
  pctRiesgoIvss: number;
  pctIvssTrab: number;
  pctRpeTrab: number;
  pctRpePatrono: number;
  pctFaovTrab: number;
  pctFaovPatrono: number;
  pctIncesTrab: number;
  pctIncesPatrono: number;
  topeIvssSm: number;
  topeRpeSm: number;
  diasUtilidades: number;
  diasBonoVacMes: number;
  horasJornada: number;
  recargoNocturno: number;
  recargoExtra: number;
  diasMes: number;
};

export const PARAMS_POR_DEFECTO: ParamsNomina = {
  salarioMinimo: 130,
  bonoAlimentacion: 45,
  pctRiesgoIvss: 0.09,
  pctIvssTrab: 0.04,
  pctRpeTrab: 0.005,
  pctRpePatrono: 0.02,
  pctFaovTrab: 0.01,
  pctFaovPatrono: 0.02,
  pctIncesTrab: 0.005,
  pctIncesPatrono: 0.02,
  topeIvssSm: 5,
  topeRpeSm: 10,
  diasUtilidades: 30,
  diasBonoVacMes: 2,
  horasJornada: 8,
  recargoNocturno: 1.3,
  recargoExtra: 1.5,
  diasMes: 30,
};

export type DatosEmpleado = { salarioMensual: number; bonoFijo: number; comision: number };
export type NovedadesMes = { horasNocturnas: number; horasExtras: number; diasFeriados: number };

export type ResultadoNomina = {
  salario: number;
  bonoNocturno: number;
  horasExtras: number;
  feriados: number;
  bonos: number;
  alimentacion: number;
  comision: number;
  alicuotaUtilidades: number;
  alicuotaBonoVacacional: number;
  salarioIntegral: number;
  ivssTrab: number;
  ivssPatrono: number;
  rpeTrab: number;
  rpePatrono: number;
  faovTrab: number;
  faovPatrono: number;
  incesTrab: number;
  incesPatrono: number;
  /** Lo que recibe el trabajador. */
  neto: number;
  /** Lo que le cuesta a la empresa en el mes (pagos + alícuotas + aportes patronales). */
  costoEmpresa: number;
};

/** Cantidad de lunes que tiene un mes (el IVSS y el RPE se pagan por semana). mes: 1-12. */
export function contarLunes(anio: number, mes: number) {
  const dias = new Date(anio, mes, 0).getDate();
  let n = 0;
  for (let d = 1; d <= dias; d++) if (new Date(anio, mes - 1, d).getDay() === 1) n++;
  return n;
}

export function calcularNomina(
  e: DatosEmpleado,
  nov: NovedadesMes,
  p: ParamsNomina,
  lunes: number,
): ResultadoNomina {
  const diario = e.salarioMensual / p.diasMes;
  const porHora = diario / p.horasJornada;

  const bonoNocturno = porHora * p.recargoNocturno * nov.horasNocturnas;
  const horasExtras = porHora * p.recargoExtra * nov.horasExtras;
  const feriados = diario * p.recargoExtra * nov.diasFeriados;
  const alicuotaUtilidades = diario * (p.diasUtilidades / 12);
  const alicuotaBonoVacacional = diario * p.diasBonoVacMes;

  const salarioIntegral =
    e.salarioMensual + bonoNocturno + horasExtras + feriados + e.bonoFijo +
    alicuotaUtilidades + alicuotaBonoVacacional + e.comision;

  // IVSS y RPE: base semanal = salario (con tope) × 12 ÷ 52, por cada lunes del mes.
  const baseIvss = (Math.min(e.salarioMensual, p.topeIvssSm * p.salarioMinimo) * 12) / 52;
  const baseRpe = (Math.min(e.salarioMensual, p.topeRpeSm * p.salarioMinimo) * 12) / 52;
  const ivssTrab = baseIvss * p.pctIvssTrab * lunes;
  const ivssPatrono = baseIvss * p.pctRiesgoIvss * lunes;
  const rpeTrab = baseRpe * p.pctRpeTrab * lunes;
  const rpePatrono = baseRpe * p.pctRpePatrono * lunes;

  const faovTrab = salarioIntegral * p.pctFaovTrab;
  const faovPatrono = salarioIntegral * p.pctFaovPatrono;
  const incesTrab = salarioIntegral * p.pctIncesTrab;
  const incesPatrono = salarioIntegral * p.pctIncesPatrono;

  const pagos =
    e.salarioMensual + bonoNocturno + horasExtras + feriados + e.bonoFijo + p.bonoAlimentacion + e.comision;
  const neto = pagos - ivssTrab - rpeTrab - faovTrab - incesTrab;
  const costoEmpresa =
    pagos + alicuotaUtilidades + alicuotaBonoVacacional + ivssPatrono + rpePatrono + faovPatrono + incesPatrono;

  return {
    salario: e.salarioMensual,
    bonoNocturno,
    horasExtras,
    feriados,
    bonos: e.bonoFijo,
    alimentacion: p.bonoAlimentacion,
    comision: e.comision,
    alicuotaUtilidades,
    alicuotaBonoVacacional,
    salarioIntegral,
    ivssTrab,
    ivssPatrono,
    rpeTrab,
    rpePatrono,
    faovTrab,
    faovPatrono,
    incesTrab,
    incesPatrono,
    neto,
    costoEmpresa,
  };
}

/** Parámetros vigentes en un período AAAA-MM: el de vigencia más reciente que no sea posterior. */
export function paramsDelPeriodo<T extends { vigenciaDesde: string }>(lista: T[], periodo: string): T | null {
  let mejor: T | null = null;
  for (const p of lista) {
    if (p.vigenciaDesde <= periodo && (!mejor || p.vigenciaDesde > mejor.vigenciaDesde)) mejor = p;
  }
  return mejor;
}

export function periodoValido(s: string | undefined): s is string {
  return !!s && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

export function periodoActual(hoy = new Date()) {
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}
