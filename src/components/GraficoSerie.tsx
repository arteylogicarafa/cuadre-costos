"use client";
import { useRef, useState } from "react";
import { fmt } from "@/lib/formato";

type Punto = { periodo: string; ingresos: number; egresos: number };

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const W = 720;
const H = 220;
const PAD = 12;

/**
 * Ingresos (área y línea) contra egresos (línea) de los últimos meses, dibujado en SVG sin librería.
 * Al pasar el puntero (o tocar) se ve el valor de cada mes. La línea de ingresos se traza al cargar.
 */
export function GraficoSerie({ serie, moneda }: { serie: Punto[]; moneda: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState<number | null>(null);

  const maximo = Math.max(...serie.flatMap((p) => [p.ingresos, p.egresos]), 0);
  const hayDatos = maximo > 0;
  const techo = hayDatos ? maximo * 1.12 : 1;
  const n = serie.length;
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(n - 1, 1);
  const y = (v: number) => H - PAD - (v / techo) * (H - PAD * 2);

  const linea = (f: (p: Punto) => number) =>
    serie.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(f(p)).toFixed(1)}`).join("");
  const dIng = linea((p) => p.ingresos);
  const dEgr = linea((p) => p.egresos);
  const area = `${dIng}L${x(n - 1).toFixed(1)} ${H - PAD}L${x(0).toFixed(1)} ${H - PAD}Z`;
  const ultimo = serie[n - 1];
  const nombreMes = (p: string) => `${MESES_LARGOS[Number(p.slice(5)) - 1]} de ${p.slice(0, 4)}`;

  function mover(e: React.PointerEvent) {
    if (!caja.current || !hayDatos) return;
    const r = caja.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round((px - PAD) / ((W - PAD * 2) / Math.max(n - 1, 1)));
    setActivo(Math.min(Math.max(i, 0), n - 1));
  }

  const resumen = hayDatos
    ? `Ingresos y egresos de los últimos ${n} meses en ${moneda}. Este mes: ingresos ${fmt(ultimo.ingresos)}, egresos ${fmt(ultimo.egresos)}.`
    : "Sin ventas ni pagos registrados en los últimos meses.";

  const p = activo !== null ? serie[activo] : null;
  const pctX = activo !== null ? (x(activo) / W) * 100 : 0;

  return (
    <figure className="m-0">
      <div className="flex gap-2">
        {/* Eje vertical: máximo, mitad y cero */}
        <div className="relative w-9 shrink-0 text-right text-[0.68rem] tabular-nums text-ink-3" aria-hidden="true">
          {[1, 0.5, 0].map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${(y(maximo * t) / H) * 100}%` }}
            >
              {hayDatos ? fmt(maximo * t, 0) : t === 0 ? "0" : ""}
            </span>
          ))}
        </div>

        <div
          ref={caja}
          className="relative min-w-0 flex-1 touch-pan-y rounded-xl border border-line bg-surface/85"
          onPointerMove={mover}
          onPointerDown={mover}
          onPointerLeave={() => setActivo(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={resumen}>
            {[1, 0.5, 0].map((t) => (
              <line
                key={t}
                x1={PAD}
                x2={W - PAD}
                y1={y(maximo * t)}
                y2={y(maximo * t)}
                stroke="var(--line)"
                strokeWidth="1"
                strokeDasharray={t === 0 ? undefined : "3 5"}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {hayDatos && (
              <>
                <g className="aparece">
                  <path d={area} fill="var(--accent)" opacity="0.16" />
                </g>
                <path
                  d={dEgr}
                  fill="none"
                  stroke="var(--s3)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  className="aparece"
                />
                <path
                  d={dIng}
                  pathLength={1}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.6"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  className="traza"
                />
                {activo !== null && (
                  <line x1={x(activo)} x2={x(activo)} y1={PAD} y2={H - PAD} stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
                )}
                {serie.map((s, i) =>
                  s.ingresos > 0 || s.egresos > 0 ? (
                    <g key={s.periodo} className="aparece">
                      <circle cx={x(i)} cy={y(s.ingresos)} r={i === (activo ?? n - 1) ? 5 : 3.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
                      <circle cx={x(i)} cy={y(s.egresos)} r={i === (activo ?? n - 1) ? 4.5 : 3} fill="var(--s3)" stroke="var(--surface)" strokeWidth="2" />
                    </g>
                  ) : null,
                )}
              </>
            )}
          </svg>

          {hayDatos && activo === null && ultimo.ingresos > 0 && (
            <span
              className="aparece pointer-events-none absolute -translate-x-full -translate-y-[135%] whitespace-nowrap rounded-md bg-accent px-1.5 py-0.5 text-[0.7rem] font-medium tabular-nums text-on-accent"
              style={{ left: `${(x(n - 1) / W) * 100}%`, top: `${(y(ultimo.ingresos) / H) * 100}%` }}
            >
              {fmt(ultimo.ingresos)}
            </span>
          )}

          {p && (
            <div
              role="status"
              className="pointer-events-none absolute top-2 z-10 w-44 rounded-lg border border-line-strong bg-surface p-2.5 text-xs shadow-lg shadow-black/20"
              style={pctX > 55 ? { right: `${100 - pctX + 2}%` } : { left: `${pctX + 2}%` }}
            >
              <p className="mb-1 font-medium capitalize text-ink">{nombreMes(p.periodo)}</p>
              <p className="flex justify-between text-ink-2">
                Ingresos <span className="tabular-nums text-ink">{fmt(p.ingresos)}</span>
              </p>
              <p className="flex justify-between text-ink-2">
                Egresos <span className="tabular-nums text-ink">{fmt(p.egresos)}</span>
              </p>
              <p className="mt-1 flex justify-between border-t border-line-soft pt-1 text-ink-2">
                Saldo{" "}
                <span className={`tabular-nums font-medium ${p.ingresos - p.egresos < 0 ? "text-bad" : "text-ink"}`}>
                  {fmt(p.ingresos - p.egresos)}
                </span>
              </p>
            </div>
          )}

          {!hayDatos && (
            <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-ink-3">
              Registra ventas y pagos para ver la tendencia.
            </p>
          )}
        </div>
      </div>

      <div className="ml-11 mt-1 flex justify-between px-1 text-[0.7rem] text-ink-3" aria-hidden="true">
        {serie.map((s, i) => (
          <span key={s.periodo} className={`${i % 2 === (n - 1) % 2 ? "" : "hidden sm:inline"} ${activo === i ? "font-medium text-ink" : ""}`}>
            {MESES[Number(s.periodo.slice(5)) - 1]}
          </span>
        ))}
      </div>

      <figcaption className="ml-11 mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 rounded bg-accent" /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="2" aria-hidden="true">
            <line x1="0" x2="20" y1="1" y2="1" stroke="var(--s3)" strokeWidth="2" strokeDasharray="5 3" />
          </svg>{" "}
          Egresos
        </span>
      </figcaption>

      {/* Tabla para lectores de pantalla */}
      <table className="sr-only">
        <caption>Ingresos y egresos por mes en {moneda}</caption>
        <thead>
          <tr><th>Mes</th><th>Ingresos</th><th>Egresos</th></tr>
        </thead>
        <tbody>
          {serie.map((s) => (
            <tr key={s.periodo}><td>{nombreMes(s.periodo)}</td><td>{fmt(s.ingresos)}</td><td>{fmt(s.egresos)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
