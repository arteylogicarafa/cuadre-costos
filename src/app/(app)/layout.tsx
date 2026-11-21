import { requerirSesion } from "@/lib/session";
import { salir } from "@/lib/acciones-auth";
import { BarraLateral, type GrupoMenu } from "@/components/BarraLateral";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { usuario, empresa, rol } = await requerirSesion();

  const grupos: GrupoMenu[] = [
    { enlaces: [{ href: "/", texto: "Resumen", icono: "resumen" }] },
    {
      titulo: "Costeo",
      enlaces: [
        { href: "/empresa", texto: "Empresa", icono: "empresa" },
        { href: "/unidades", texto: "Unidades de medida", icono: "unidades" },
        { href: "/materia-prima", texto: "Materia prima", icono: "materia" },
        { href: "/insumos", texto: "Insumos", icono: "insumos" },
        { href: "/productos", texto: "Productos y recetas", icono: "productos" },
        { href: "/indirectos", texto: "Costos indirectos", icono: "indirectos" },
        { href: "/activos", texto: "Activos (PPE)", icono: "activos" },
        { href: "/informes/estructura", texto: "Estructura de costos", icono: "estructura" },
      ],
    },
    // La nómina muestra sueldos: el rol de solo consulta no la ve.
    ...(rol === "CONSULTA"
      ? []
      : [
          {
            titulo: "Nómina",
            enlaces: [
              { href: "/nomina/parametros", texto: "Parámetros", icono: "parametros" as const },
              { href: "/nomina/empleados", texto: "Empleados", icono: "empleados" as const },
              { href: "/nomina/calculo", texto: "Cálculo", icono: "calculo" as const },
            ],
          },
        ]),
    {
      titulo: "Finanzas",
      enlaces: [
        { href: "/ventas", texto: "Ventas", icono: "ventas" },
        { href: "/pagos", texto: "Pagos y gastos", icono: "pagos" },
        { href: "/finanzas/resultados", texto: "Estado de resultados", icono: "resultados" },
        { href: "/finanzas/situacion", texto: "Estado de situación", icono: "situacion" },
        { href: "/finanzas/ingresos-egresos", texto: "Ingresos vs egresos", icono: "ingresos" },
      ],
    },
    {
      titulo: "Herramientas",
      enlaces: [
        { href: "/simulador", texto: "Simulador de combos", icono: "simulador" },
        { href: "/proyecciones", texto: "Proyecciones", icono: "proyecciones" },
        { href: "/importar", texto: "Importar desde Excel", icono: "importar" },
      ],
    },
  ];

  return (
    <div className="min-h-screen md:flex print:block">
      <BarraLateral grupos={grupos} empresa={empresa.razonSocial} usuario={usuario.nombre} salir={salir} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-9 print:p-0">{children}</main>
    </div>
  );
}
