import { requerirSesion } from "@/lib/session";
import { cargarEntrada } from "@/lib/datos-costos";
import { calcularEstructuras, proyectar, variablesYFijos, type Escenario } from "@/lib/costos";
import { fmt, fmtPct } from "@/lib/formato";

type Busqueda = { unidades?: string; precio?: string; variable?: string; fijos?: string };

/** Porcentaje de la URL → fracción. Valores no numéricos dan 0; se limita entre −100 % y +1000 %. */
const pct = (s: string | undefined) => {
  const n = Number(s);
  return Number.isFinite(n) ? Math.min(Math.max(n, -100), 1000) / 100 : 0;
};

export default async function Proyecciones({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const { empresa } = await requerirSesion();
  const sp = await searchParams;
  const esc: Escenario = {
    pctUnidades: pct(sp.unidades),
    pctPrecio: pct(sp.precio),
    pctVariable: pct(sp.variable),
    pctFijos: pct(sp.fijos),
  };

  let error: string | null = null;
  let base = null;
  let escenario = null;
  try {
    const entrada = await cargarEntrada(empresa);
    const { productos, fijos } = variablesYFijos(entrada, calcularEstructuras(entrada));
    const cero: Escenario = { pctUnidades: 0, pctPrecio: 0, pctVariable: 0, pctFijos: 0 };
    base = proyectar(productos, fijos, cero);
    escenario = proyectar(productos, fijos, esc);
  } catch (e) {
    error = (e as Error).message;
  }

  const campos = [
    { n: "unidades", t: "Unidades vendidas (%)", v: sp.unidades },
    { n: "precio", t: "Precios (%)", v: sp.precio },
    { n: "variable", t: "Costos variables (%)", v: sp.variable },
    { n: "fijos", t: "Costos fijos (%)", v: sp.fijos },
  ];

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Proyecciones y punto de equilibrio</h1>
        <p className="text-sm text-ink-2">
          Proyección de un mes en {empresa.moneda}, partiendo de la producción mensual de cada producto. Cambia los
          porcentajes para ver un escenario. Los costos variables son materia prima, insumos y mano de obra propia;
          los fijos son indirectos, depreciación y nómina.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-4 text-sm">
        {campos.map((c) => (
          <label key={c.n} className="flex flex-col gap-1">
            <span className="text-ink-2">{c.t}</span>
            <input
              name={c.n}
              type="number"
              step="any"
              placeholder="0"
              defaultValue={c.v ?? ""}
              className="w-36 rounded-md border border-line-strong bg-field px-3 py-2"
            />
          </label>
        ))}
        <button className="rounded-md bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-strong">Calcular</button>
      </form>

      {error && <p role="alert" className="text-sm text-bad">{error}</p>}

      {base && escenario && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line-strong text-right text-ink-2">
                  <th className="py-2 text-left">Mensual</th>
                  <th>Base (hoy)</th>
                  <th>Escenario</th>
                  <th>Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Unidades", base.unidades, escenario.unidades, 0],
                    ["Ingresos (sin IVA)", base.ingresos, escenario.ingresos, 2],
                    ["Costos variables", base.costoVariable, escenario.costoVariable, 2],
                    ["Contribución", base.contribucion, escenario.contribucion, 2],
                    ["Costos fijos", base.fijos, escenario.fijos, 2],
                    ["Utilidad operativa", base.utilidad, escenario.utilidad, 2],
                  ] as [string, number, number, number][]
                ).map(([t, a, b, dec]) => (
                  <tr key={t} className={`border-b border-line-soft text-right tabular-nums ${t === "Utilidad operativa" ? "font-semibold" : ""}`}>
                    <td className="py-2 text-left">{t}</td>
                    <td>{fmt(a, dec)}</td>
                    <td>{fmt(b, dec)}</td>
                    <td className={b - a < 0 ? "text-bad" : ""}>{fmt(b - a, dec)}</td>
                  </tr>
                ))}
                <tr className="border-b border-line-soft text-right tabular-nums font-semibold">
                  <td className="py-2 text-left">Utilidad anual (×12)</td>
                  <td>{fmt(base.utilidad * 12)}</td>
                  <td>{fmt(escenario.utilidad * 12)}</td>
                  <td className={escenario.utilidad < base.utilidad ? "text-bad" : ""}>
                    {fmt((escenario.utilidad - base.utilidad) * 12)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs text-ink-3">Punto de equilibrio (unidades al mes)</p>
              <p className="text-lg font-semibold tabular-nums">
                {escenario.equilibrio === null ? "No alcanzable" : fmt(escenario.equilibrio, 0)}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs text-ink-3">Margen de seguridad</p>
              <p className="text-lg font-semibold tabular-nums">
                {escenario.margenSeguridad === null ? "—" : fmtPct(escenario.margenSeguridad)}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs text-ink-3">Resultado del escenario</p>
              <p className={`text-lg font-semibold ${escenario.utilidad < 0 ? "text-bad" : ""}`}>
                {escenario.utilidad < 0 ? "Pérdida" : "Ganancia"}
              </p>
            </div>
          </section>

          <p className="max-w-prose text-xs text-ink-3">
            El punto de equilibrio mantiene la mezcla de productos: son las unidades totales al mes en las que la
            contribución cubre los costos fijos. El margen de seguridad es cuánto pueden bajar las ventas antes de
            perder. Es una estimación gerencial: no incluye gastos que no estén en la estructura de costos.
          </p>
        </>
      )}
    </div>
  );
}
