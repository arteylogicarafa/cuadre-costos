import { requerirSesion } from "@/lib/session";
import { FormularioImportar } from "@/components/FormularioImportar";

export default async function Importar() {
  const { rol } = await requerirSesion();
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Importar desde Excel</h1>
        <p className="text-sm text-ink-2">
          Carga tu lista de materia prima. Funciona con la plantilla de abajo o con una hoja como la de
          &quot;Centro de Costos&quot; de una hoja de costos: el sistema busca las columnas Código, Nombre (o Producto), Unidad
          (o Presentación), Cantidad y Costo presentación. Los códigos que ya existen no se sobrescriben.
        </p>
        <p className="mt-2 text-sm">
          <a href="/api/plantilla/materia-prima" className="text-accent-ink underline">Descargar plantilla</a>
        </p>
      </div>
      {rol === "CONSULTA" ? (
        <p className="text-sm text-ink-2">Tu rol es solo de consulta.</p>
      ) : (
        <>
          <p className="text-sm text-ink-2">
            Empieza con &quot;Solo revisar&quot; marcado: te muestra qué se importaría y qué datos parecen errores, sin
            guardar nada.
          </p>
          <FormularioImportar />
        </>
      )}
    </div>
  );
}
