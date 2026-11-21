import { roseta } from "@/lib/guilloche";

const capas = roseta(24, 24, 22.5, 2, 1);

/**
 * Marca de Cuadre: una roseta de grabado (anillo festoneado de dos trazos) alrededor de una moneda con una
 * "C" abierta cuyo hueco guarda un punto, el cuadre de cuentas. Vectorial; usa el acento del tema.
 */
export function Marca({ tamano = 36, className = "" }: { tamano?: number; className?: string }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Cuadre"
      className={className}
      fill="none"
    >
      <g stroke="var(--accent)" strokeWidth="1.15" strokeLinejoin="round">
        {capas.map((d, i) => (
          <path key={i} d={d} opacity={i === 0 ? 0.55 : 1} />
        ))}
      </g>
      <circle cx="24" cy="24" r="12.2" fill="var(--accent)" />
      <path
        d="M29.2 18.9A7.2 7.2 0 1 0 29.2 29.1"
        stroke="var(--on-accent)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="29.4" cy="24" r="1.9" fill="var(--on-accent)" />
    </svg>
  );
}

/** Marca con el nombre al lado. */
export function Logo({ tamano = 36 }: { tamano?: number }) {
  return (
    <span className="flex items-center gap-3">
      <Marca tamano={tamano} />
      <span className="leading-none">
        <span className="block font-display text-xl font-semibold tracking-tight text-ink" style={{ fontFamily: "var(--font-display)" }}>
          Cuadre
        </span>
        <span className="mt-1 block text-[0.7rem] text-ink-3">Estructura de costos</span>
      </span>
    </span>
  );
}
