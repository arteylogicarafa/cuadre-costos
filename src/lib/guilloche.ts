// Geometría de grabado de seguridad (guilloché): curvas hipotrocoides y bandas de ondas.
// Funciones puras: el mismo resultado en servidor y cliente, sin números aleatorios.

const f = (n: number) => n.toFixed(2);

/** Hipotrocoide cerrado. R, r enteros: se cierra tras r/mcd(R,r) vueltas. */
export function hipotrocoide(cx: number, cy: number, R: number, r: number, d: number, pasos = 720): string {
  const mcd = (a: number, b: number): number => (b === 0 ? a : mcd(b, a % b));
  const vueltas = r / mcd(R, r);
  const k = (R - r) / r;
  const pts: string[] = [];
  for (let i = 0; i <= pasos; i++) {
    const t = (i / pasos) * Math.PI * 2 * vueltas;
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin(k * t);
    pts.push(`${i === 0 ? "M" : "L"}${f(x)} ${f(y)}`);
  }
  return pts.join("") + "Z";
}

/**
 * Roseta de grabado: anillos concéntricos de pétalos finos. Cada anillo tiene más pétalos que el anterior y
 * `capas` trazos con amplitud y desfase distintos, que al cruzarse dibujan el muaré típico de un billete.
 * El anillo más externo (con su amplitud máxima) queda dentro de `radio`, así nunca se recorta.
 */
export function roseta(cx: number, cy: number, radio: number, capas = 3, anillos = 4): string[] {
  const out: string[] = [];
  for (let a = 0; a < anillos; a++) {
    const base = radio * (anillos === 1 ? 0.8 : 0.28 + (0.58 * a) / (anillos - 1));
    const petalos = 11 + 4 * a;
    for (let l = 0; l < capas; l++) {
      const amp = radio * 0.12 * ((l + 1) / capas);
      const fase = (l * Math.PI) / petalos;
      const pasos = petalos * 32;
      let d = "";
      for (let i = 0; i <= pasos; i++) {
        const t = (i / pasos) * Math.PI * 2;
        const x = cx + base * Math.cos(t) + amp * Math.cos(petalos * t + fase);
        const y = cy + base * Math.sin(t) - amp * Math.sin(petalos * t + fase);
        d += `${i === 0 ? "M" : "L"}${f(x)} ${f(y)}`;
      }
      out.push(d + "Z");
    }
  }
  return out;
}

/** Banda de ondas finas, como la franja de un billete. Devuelve un trazo por línea. */
export function ondas(ancho: number, alto: number, lineas: number, amplitud: number, ciclos: number): string[] {
  const out: string[] = [];
  for (let l = 0; l < lineas; l++) {
    const fase = (l / lineas) * Math.PI * 2;
    const base = (alto / (lineas + 1)) * (l + 1);
    let d = "";
    for (let x = 0; x <= ancho; x += 4) {
      const y =
        base +
        amplitud * Math.sin((x / ancho) * Math.PI * 2 * ciclos + fase) +
        amplitud * 0.35 * Math.sin((x / ancho) * Math.PI * 2 * ciclos * 2.3 - fase);
      d += `${x === 0 ? "M" : "L"}${f(x)} ${f(y)}`;
    }
    out.push(d);
  }
  return out;
}
