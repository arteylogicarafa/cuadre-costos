import { requerirSesion, requerirNomina } from "@/lib/session";
import { crearLibro, respuestaXlsx } from "@/lib/libro-excel";
import { cargarEntrada } from "@/lib/datos-costos";
import { calcularEstructuras } from "@/lib/costos";
import { aCalc, ventasDelPeriodo } from "@/lib/datos-finanzas";
import { calcularVenta } from "@/lib/finanzas";
import { nominaDelPeriodo } from "@/lib/datos-nomina";
import { periodoActual, periodoValido } from "@/lib/nomina";
import { fmtFecha } from "@/lib/formato";

export async function GET(req: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const q = new URL(req.url).searchParams.get("periodo") ?? undefined;
  const periodo = periodoValido(q) ? q : periodoActual();

  if (tipo === "estructura") {
    const { empresa } = await requerirSesion();
    const filas = calcularEstructuras(await cargarEntrada(empresa));
    const libro = await crearLibro(
      "Estructura de costos",
      `${empresa.razonSocial} · estructura de costos y precios por unidad (${empresa.moneda})`,
      [
        { titulo: "Código", ancho: 10 },
        { titulo: "Producto", ancho: 32 },
        ...["Materia prima", "Insumos", "Mano de obra", "Costo directo", "Costo indirecto", "Costo total",
          "Gastos ajenos", "Utilidad", "Precio sin IVA", "IVA", "Precio final"].map((t) => ({ titulo: t, formato: "numero" as const })),
        { titulo: "% prorrateo", formato: "porcentaje" as const },
      ],
      filas.map((f) => [f.codigo, f.nombre, f.materiaPrima, f.insumos, f.manoObra, f.directo, f.indirecto,
        f.costoTotal, f.gastosAjenos, f.utilidad, f.precioSinIva, f.iva, f.precio, f.pctProrrateo]),
    );
    return respuestaXlsx(libro, "estructura-de-costos.xlsx");
  }

  if (tipo === "ventas") {
    const { empresa } = await requerirSesion();
    const ventas = await ventasDelPeriodo(empresa.id, periodo);
    const libro = await crearLibro(
      "Ventas",
      `${empresa.razonSocial} · ventas ${periodo} (${empresa.moneda})`,
      [
        { titulo: "Fecha", ancho: 12 },
        { titulo: "Producto", ancho: 30 },
        ...["Cantidad", "Precio sin IVA", "Descuento", "Base imponible", "IVA", "Total", "Costo", "Utilidad"].map((t) => ({ titulo: t, formato: "numero" as const })),
      ],
      ventas.map((v) => {
        const r = calcularVenta(aCalc(v));
        return [fmtFecha(v.fecha), v.producto.nombre, v.cantidad, v.precioUnitario, v.descuento, r.base, r.iva, r.total, r.costoTotal, r.utilidad];
      }),
    );
    return respuestaXlsx(libro, `ventas-${periodo}.xlsx`);
  }

  if (tipo === "nomina") {
    // La nómina muestra sueldos: el rol de solo consulta no puede exportarla.
    const { empresa } = await requerirNomina();
    const n = await nominaDelPeriodo(empresa.id, periodo);
    const libro = await crearLibro(
      "Nómina",
      `${empresa.razonSocial} · nómina ${periodo} (${empresa.moneda})`,
      [
        { titulo: "Cédula", ancho: 12 },
        { titulo: "Empleado", ancho: 28 },
        { titulo: "Cargo", ancho: 22 },
        ...["Salario", "Bono nocturno", "Horas extras", "Feriados", "Bonos", "Alimentación", "Comisión",
          "IVSS trab.", "RPE trab.", "FAOV trab.", "INCES trab.", "Neto a cobrar", "Salario integral", "Costo empresa"]
          .map((t) => ({ titulo: t, formato: "numero" as const })),
      ],
      n.filas.map(({ empleado: e, r }) => [e.cedula, e.nombre, e.cargo, r.salario, r.bonoNocturno, r.horasExtras,
        r.feriados, r.bonos, r.alimentacion, r.comision, r.ivssTrab, r.rpeTrab, r.faovTrab, r.incesTrab,
        r.neto, r.salarioIntegral, r.costoEmpresa]),
    );
    return respuestaXlsx(libro, `nomina-${periodo}.xlsx`);
  }

  return new Response("No encontrado", { status: 404 });
}
