import { ondas, roseta } from "@/lib/guilloche";

const bandas = ondas(480, 120, 18, 6, 3);
const bandas2 = ondas(480, 120, 12, 9, 2);
const rosetas = roseta(100, 100, 94, 3, 5);

/**
 * Fondo de grabado para placas de cifras. Se coloca detrás del contenido (absolute, inset-0) y nunca
 * recibe clics. Líneas finas de baja opacidad con una zona limpia donde van los números.
 *  - "ondas": franja de ondas que cubre toda la placa; la zona limpia está arriba a la izquierda (la cifra).
 *  - "roseta": roseta grande en una esquina, que se desvanece hacia el contenido.
 */
export function Grabado({ variante = "ondas", className = "" }: { variante?: "ondas" | "roseta"; className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {variante === "ondas" ? (
        <>
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 480 120">
            <g fill="none" stroke="var(--engrave)" strokeWidth="1">
              {bandas.map((d, i) => (
                <path key={i} d={d} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
            <g fill="none" stroke="var(--engrave)" strokeWidth="1" opacity="0.6">
              {bandas2.map((d, i) => (
                <path key={i} d={d} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          </svg>
          {/* Zona limpia detrás de la cifra principal */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 58% 30% at 26% 24%, var(--surface) 38%, transparent 100%)",
            }}
          />
        </>
      ) : (
        <>
          <svg className="absolute -right-32 -top-32 h-80 w-80" viewBox="0 0 200 200">
            <g fill="none" stroke="var(--engrave)" strokeWidth="0.6">
              {rosetas.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </svg>
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(225deg, transparent 12%, var(--surface) 52%)" }}
          />
        </>
      )}
    </div>
  );
}
