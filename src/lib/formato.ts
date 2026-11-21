export const CATEGORIAS = {
  ALQUILER_SERVICIO: "Alquileres y servicios",
  PERMISO: "Permisología",
  UNIFORME: "Uniformes y dotación",
  SERVICIO_EXTERNO: "Servicios externos",
  OTRO: "Otros",
} as const;

export const CATEGORIAS_PAGO = {
  ...CATEGORIAS,
  NOMINA_ADMIN: "Nómina de administración",
} as const;

export const fmtFecha = (f: Date) => f.toISOString().slice(0, 10);

export const fmt =(n: number, dec = 2) =>
  n.toLocaleString("es-VE", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const fmtPct = (x: number) => `${(x * 100).toLocaleString("es-VE", { maximumFractionDigits: 2 })} %`;
