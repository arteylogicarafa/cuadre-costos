import type { ReactNode } from "react";
import { roseta } from "@/lib/guilloche";
import { Logo } from "./Logo";
import { SelectorTema } from "./SelectorTema";

const capas = roseta(300, 300, 290, 3, 5);

/** Marco de inicio de sesión y registro: panel de marca con roseta de grabado y formulario a un lado. */
export function PantallaAcceso({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-line bg-sunken lg:block">
        {/* Roseta decorativa que gira muy despacio en la esquina; el texto queda sobre fondo limpio */}
        <div aria-hidden="true" className="grabado-deriva absolute -right-56 -top-40 h-[46rem] w-[46rem]">
          <svg viewBox="0 0 600 600" fill="none" className="h-full w-full">
            <g stroke="var(--engrave)" strokeWidth="0.6">
              {capas.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </svg>
        </div>
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo tamano={44} />
          <div className="max-w-md">
            <p className="text-4xl font-semibold leading-tight tracking-tight text-ink">
              Cada costo, a su precio justo.
            </p>
            <p className="mt-4 text-base text-ink-2">
              Materia prima, nómina y gastos se encadenan hasta el precio final de cada producto. Tú ves
              cuánto cuesta, cuánto cobrar y cuánto ganas.
            </p>
          </div>
          <p className="text-xs text-ink-3">Hecho para pymes: del Excel al sistema.</p>
        </div>
      </section>

      <section className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="lg:hidden">
            <Logo tamano={34} />
          </span>
          <SelectorTema />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-7 py-10">
          <div className="entra">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">{titulo}</h1>
            <p className="mt-2 text-sm text-ink-2">{subtitulo}</p>
          </div>
          <div className="entra" style={{ animationDelay: "80ms" }}>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
