import { requerirSesion } from "@/lib/session";
import { cargarEntrada } from "@/lib/datos-costos";
import { calcularEstructuras } from "@/lib/costos";
import { Simulador } from "@/components/Simulador";

export default async function PaginaSimulador() {
  const { empresa } = await requerirSesion();
  let productos: { id: string; nombre: string; precioSinIva: number; costoTotal: number }[] = [];
  let error: string | null = null;
  try {
    productos = calcularEstructuras(await cargarEntrada(empresa)).map((f) => ({
      id: f.id, nombre: f.nombre, precioSinIva: f.precioSinIva, costoTotal: f.costoTotal,
    }));
  } catch (e) {
    error = (e as Error).message;
  }
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Simulador de combos</h1>
        <p className="text-sm text-ink-2">
          Arma un combo con tus productos y ve su costo, precio y margen según el descuento. Usa los precios y
          costos actuales de la estructura de costos. No guarda nada.
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      <Simulador productos={productos} pctIva={empresa.pctIva} moneda={empresa.moneda} />
    </div>
  );
}
