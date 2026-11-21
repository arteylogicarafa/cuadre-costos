import Link from "next/link";
import { Formulario, Campo } from "@/components/Formulario";
import { PantallaAcceso } from "@/components/PantallaAcceso";
import { registrar } from "@/lib/acciones-auth";

export default function Registro() {
  return (
    <PantallaAcceso
      titulo="Registra tu empresa"
      subtitulo="Creamos tu usuario administrador y la empresa con unidades de medida básicas."
    >
      <Formulario accion={registrar} boton="Crear cuenta" className="flex flex-col gap-4">
        <Campo nombre="razonSocial" etiqueta="Razón social" />
        <Campo nombre="rif" etiqueta="RIF (opcional)" requerido={false} />
        <Campo nombre="nombre" etiqueta="Tu nombre" />
        <Campo nombre="correo" etiqueta="Correo" tipo="email" />
        <Campo nombre="clave" etiqueta="Contraseña (mínimo 8 caracteres)" tipo="password" />
      </Formulario>
      <p className="mt-6 text-sm text-ink-2">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-accent-ink underline">
          Inicia sesión
        </Link>
      </p>
    </PantallaAcceso>
  );
}
