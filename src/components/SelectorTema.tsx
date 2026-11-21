"use client";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "claro" | "oscuro";

// La fuente de verdad es <html data-tema>. Todos los selectores de la página la leen, así nunca se desincronizan.
function suscribir(aviso: () => void) {
  const observador = new MutationObserver(aviso);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });
  return () => observador.disconnect();
}
const leer = (): Tema => (document.documentElement.dataset.tema === "oscuro" ? "oscuro" : "claro");
const leerServidor = (): Tema | null => null;

/** Alterna entre tema claro y oscuro. La elección se guarda en el navegador; sin ella se usa la del sistema. */
export function SelectorTema({ compacto = false }: { compacto?: boolean }) {
  const tema = useSyncExternalStore<Tema | null>(suscribir, leer, leerServidor);

  function cambiar(nuevo: Tema) {
    document.documentElement.dataset.tema = nuevo;
    try {
      localStorage.setItem("tema", nuevo);
    } catch {
      /* sin almacenamiento: el cambio vale solo para esta visita */
    }
  }

  const opciones: { v: Tema; t: string; icono: typeof Sun }[] = [
    { v: "claro", t: "Claro", icono: Sun },
    { v: "oscuro", t: "Oscuro", icono: Moon },
  ];

  return (
    <div role="group" aria-label="Tema de color" className="inline-flex rounded-lg border border-line bg-field p-0.5">
      {opciones.map(({ v, t, icono: Icono }) => {
        const activo = tema === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => cambiar(v)}
            aria-pressed={activo}
            title={`Tema ${t.toLowerCase()}`}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${compacto ? "h-10 w-10 justify-center px-0 md:h-auto md:w-auto" : ""} ${
              activo ? "bg-accent text-on-accent" : "text-ink-2 hover:bg-hover"
            }`}
          >
            <Icono size={14} aria-hidden="true" />
            {!compacto && t}
          </button>
        );
      })}
    </div>
  );
}
