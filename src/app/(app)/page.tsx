import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CircleCheck, Plus, TriangleAlert } from "lucide-react";
import { requerirSesion } from "@/lib/session";
import { cargarResumen } from "@/lib/datos-resumen";
import { Grabado } from "@/components/Grabado";
import { GraficoSerie } from "@/components/GraficoSerie";
import { fmt, fmtPct } from "@/lib/formato";

const panel = "relative overflow-hidden rounded-2xl border border-line bg-surface p-5 md:p-6";
// La placa principal se distingue del resto: borde con tinte de acento y más aire.
const placa = "relative overflow-hidden rounded-2xl border border-accent/45 bg-surface p-5 md:p-8 shadow-[0_1px_0_0_var(--line)]";

export default async function Resumen() {
  const { empresa, usuario } = await requerirSesion();
  const r = await cargarResumen(empresa);

  const mes = new Date(`${r.periodo}-01T00:00:00Z`).toLocaleDateString("es-VE", {
    month: "long", year: "numeric", timeZone: "UTC",
  });
  const diferencia = r.utilidad - r.utilidadPrevia;
  const sube = diferencia >= 0;
  const hayPrevio = r.utilidadPrevia !== 0;
  const nombre = usuario.nombre.split(" ")[0];

  const partes = r.costoUnitario
    ? [
        { t: "Materia prima", v: r.costoUnitario.materiaPrima, c: "var(--s1)" },
        { t: "Insumos", v: r.costoUnitario.insumos, c: "var(--s2)" },
        { t: "Mano de obra", v: r.costoUnitario.manoObra, c: "var(--s3)" },
        { t: "Indirectos", v: r.costoUnitario.indirecto, c: "var(--s4)" },
      ]
    : [];

  const eq = r.equilibrio;
  const proporcion = eq && eq.unidades !== null && eq.vendidas > 0 ? Math.min(eq.unidades / eq.vendidas, 1.4) : 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Hola, {nombre}</h1>
          <p className="mt-1 text-sm text-ink-2">
            Así va {empresa.razonSocial} en {mes}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/empresa"
            className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-xs text-ink-2 hover:bg-hover md:min-h-0 md:px-3 md:py-1.5"
            title="Moneda y tasa de la empresa"
          >
            {empresa.moneda} · tasa {fmt(empresa.tasaCambio)}
          </Link>
          <Link
            href="/ventas"
            className="flex min-h-11 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-strong md:min-h-0 md:py-2"
          >
            <Plus size={16} aria-hidden="true" /> Registrar venta
          </Link>
        </div>
      </header>

      {r.errorCalculo && (
        <p role="alert" className="rounded-lg border border-line bg-surface p-3 text-sm text-bad">
          No se pudo calcular el costeo: {r.errorCalculo}
        </p>
      )}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Placa principal: utilidad del mes y tendencia */}
        <div className={placa}>
          <Grabado variante="ondas" />
          <div className="relative">
            <p className="text-sm text-ink-2">
              Utilidad neta de {mes}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <p className={`cifra text-6xl font-semibold leading-none ${r.utilidad < 0 ? "text-bad" : "text-ink"}`}>
                {fmt(r.utilidad)}
                <span className="ml-2 font-sans text-lg font-medium text-ink-3">{empresa.moneda}</span>
              </p>
              {hayPrevio && (
                <p
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    sube ? "bg-accent/15 text-accent-ink" : "bg-bad/15 text-bad"
                  }`}
                >
                  {sube ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />}
                  {sube ? "+" : "−"}
                  {fmt(Math.abs(diferencia))} frente al mes anterior
                </p>
              )}
            </div>
            <p className="mt-2 text-sm text-ink-2">
              Ingresos del mes: <span className="font-medium tabular-nums text-ink">{fmt(r.ingresos)}</span>
            </p>
            <div className="mt-6">
              <GraficoSerie serie={r.serie} moneda={empresa.moneda} />
            </div>
          </div>
        </div>

        {/* Columna derecha: composición del costo y equilibrio */}
        <div className="flex flex-col gap-6">
          <div className={`${panel} panel-grabado`}>
            <Grabado variante="roseta" />
            <h2 className="relative text-sm font-semibold text-ink">Qué compone el costo de una unidad</h2>
            {r.costoUnitario ? (
              <>
                <p className="cifra relative mt-2 text-4xl font-semibold text-ink">
                  {fmt(r.costoUnitario.total, 2)}
                  <span className="ml-2 font-sans text-sm font-medium text-ink-3">{empresa.moneda} en promedio</span>
                </p>
                <div
                  className="mt-4 flex h-3 overflow-hidden rounded-full bg-hover"
                  role="img"
                  aria-label={`Composición del costo: ${partes.map((p) => `${p.t} ${fmtPct(p.v / r.costoUnitario!.total)}`).join(", ")}`}
                >
                  {partes.map((p) => (
                    <span key={p.t} style={{ width: `${(p.v / r.costoUnitario!.total) * 100}%`, background: p.c }} />
                  ))}
                </div>
                <ul className="mt-4 flex flex-col text-sm">
                  {partes.map((p) => (
                    <li key={p.t} className="flex items-center gap-2.5 border-b border-line-soft py-2 last:border-0">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: p.c }} />
                      <span className="flex-1 text-ink-2">{p.t}</span>
                      <span className="tabular-nums text-ink">{fmt(p.v, 2)}</span>
                      <span className="w-14 text-right tabular-nums text-ink-3">
                        {fmtPct(p.v / r.costoUnitario!.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-3">
                Crea productos con receta y producción mensual para ver cómo se compone su costo.
              </p>
            )}
          </div>

          <div className={`${panel}`}>
            <h2 className="text-sm font-semibold text-ink">Punto de equilibrio</h2>
            {eq && eq.unidades !== null ? (
              <>
                <p className="mt-2 text-sm text-ink-2">
                  Necesitas vender{" "}
                  <span className="font-semibold tabular-nums text-ink">{fmt(eq.unidades, 0)}</span> de tus{" "}
                  <span className="tabular-nums">{fmt(eq.vendidas, 0)}</span> unidades al mes para cubrir los costos.
                </p>
                <div className="relative mt-4 h-3 rounded-full bg-hover" role="img" aria-label={`Equilibrio en ${fmt(eq.unidades, 0)} de ${fmt(eq.vendidas, 0)} unidades`}>
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-accent"
                    style={{ width: `${Math.min(proporcion, 1) * (100 / 1.4)}%` }}
                  />
                  <span className="absolute -top-1 bottom-[-4px] w-0.5 rounded bg-ink" style={{ left: `${100 / 1.4}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[0.7rem] text-ink-3">
                  <span>0</span>
                  <span>Producción actual</span>
                </div>
                {eq.seguridad !== null && (
                  <p className="mt-3 text-sm text-ink-2">
                    Margen de seguridad:{" "}
                    <span className={`font-semibold tabular-nums ${eq.seguridad < 0 ? "text-bad" : "text-ink"}`}>
                      {fmtPct(eq.seguridad)}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-3">
                {eq ? "Con los precios actuales no hay contribución que cubra los costos fijos." : "Aún no hay datos para calcularlo."}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className={`${panel}`}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-ink">Productos por margen</h2>
            <Link href="/informes/estructura" className="-my-3 inline-block py-3 text-xs text-accent-ink underline">
              Ver estructura completa
            </Link>
          </div>
          {r.productos.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {r.productos.slice(0, 6).map((p) => (
                <li key={p.nombre} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,12rem)_1fr_auto]">
                  <span className="truncate text-ink">{p.nombre}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-hover">
                    <span
                      className={`block h-full rounded-full ${p.margen < 0 ? "bg-bad" : "bg-accent"}`}
                      style={{ width: `${Math.max(Math.min(Math.abs(p.margen), 1) * 100, 2)}%` }}
                    />
                  </span>
                  <span className="w-28 text-right tabular-nums text-ink-2">
                    <span className="font-medium text-ink">{fmtPct(p.margen)}</span> · {fmt(p.precio)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-3">Aún no hay productos principales con receta.</p>
          )}
          <p className="mt-4 text-xs text-ink-3">Margen = (precio sin IVA − costo total) ÷ precio sin IVA.</p>
        </div>

        <div className={`${panel}`}>
          <h2 className="text-sm font-semibold text-ink">Por cargar o revisar</h2>
          {r.pendientes.length > 0 ? (
            <ul className="mt-3 flex flex-col">
              {r.pendientes.map((p) => (
                <li key={p.texto} className="border-b border-line-soft last:border-0">
                  <Link href={p.href} className="flex items-start gap-3 rounded-lg px-1 py-2.5 text-sm text-ink-2 hover:text-ink">
                    <TriangleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-warn" />
                    {p.texto}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-2">
              <CircleCheck size={18} aria-hidden="true" className="text-accent-ink" /> Todo está al día.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
