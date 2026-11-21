"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeftRight, BadgeDollarSign, Boxes, Building2, Calculator, ChartLine, Cog, FlaskConical, Layers,
  LayoutDashboard, LogOut, Menu, Package, ReceiptText, Ruler, Scale, SlidersHorizontal, TrendingUp, Upload,
  Users, Wallet, Wheat, X,
} from "lucide-react";
import { Logo, Marca } from "./Logo";
import { SelectorTema } from "./SelectorTema";

const ICONOS = {
  resumen: LayoutDashboard, empresa: Building2, unidades: Ruler, materia: Wheat, insumos: Boxes,
  productos: Package, indirectos: ReceiptText, activos: Cog, estructura: Layers, parametros: SlidersHorizontal,
  empleados: Users, calculo: Calculator, ventas: BadgeDollarSign, pagos: Wallet, resultados: TrendingUp,
  situacion: Scale, ingresos: ArrowLeftRight, simulador: FlaskConical, proyecciones: ChartLine, importar: Upload,
} as const;

export type IconoMenu = keyof typeof ICONOS;
export type GrupoMenu = { titulo?: string; enlaces: { href: string; texto: string; icono: IconoMenu }[] };

export function BarraLateral({
  grupos, empresa, usuario, salir,
}: {
  grupos: GrupoMenu[];
  empresa: string;
  usuario: string;
  salir: () => Promise<void>;
}) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);

  // El menú móvil se cierra al navegar.
  useEffect(() => setAbierto(false), [ruta]);

  const activo = (href: string) => (href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(href + "/"));

  return (
    <>
      {/* Barra superior en pantallas pequeñas */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-sunken/95 px-4 py-2.5 backdrop-blur md:hidden print:hidden">
        <span className="flex items-center gap-2.5">
          <Marca tamano={30} />
          <span className="text-base font-semibold tracking-tight">Costear</span>
        </span>
        <div className="flex items-center gap-2">
          <SelectorTema compacto />
          <button
            type="button"
            onClick={() => setAbierto((a) => !a)}
            aria-expanded={abierto}
            aria-controls="menu-lateral"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-ink-2 hover:bg-hover"
          >
            {abierto ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <aside
        id="menu-lateral"
        className={`${abierto ? "flex" : "hidden"} fixed inset-x-0 bottom-0 top-[3.4rem] z-20 flex-col overflow-hidden border-line bg-sunken p-4 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:border-r print:hidden`}
      >
        <div className="mb-5 hidden md:block">
          <Logo />
        </div>

        <div className="mb-4 rounded-lg border border-line bg-surface px-3 py-2">
          <p className="truncate text-sm font-medium text-ink">{empresa}</p>
          <p className="truncate text-xs text-ink-3">{usuario}</p>
        </div>

        <nav aria-label="Principal" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {grupos.map((g, i) => (
            <div key={g.titulo ?? i}>
              {g.titulo && <p className="mb-1 px-3 text-[0.7rem] font-semibold text-ink-3">{g.titulo}</p>}
              <ul className="flex flex-col gap-0.5">
                {g.enlaces.map((e) => {
                  const Icono = ICONOS[e.icono];
                  const on = activo(e.href);
                  return (
                    <li key={e.href}>
                      <Link
                        href={e.href}
                        aria-current={on ? "page" : undefined}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm ${
                          on
                            ? "bg-accent font-medium text-on-accent"
                            : "text-ink-2 hover:bg-hover hover:text-ink"
                        }`}
                      >
                        <Icono size={16} aria-hidden="true" className="shrink-0" />
                        {e.texto}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-4">
          <SelectorTema />
          <form action={salir}>
            <button
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-ink-2 hover:bg-hover hover:text-ink"
              aria-label="Cerrar sesión"
            >
              <LogOut size={14} aria-hidden="true" /> Salir
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
