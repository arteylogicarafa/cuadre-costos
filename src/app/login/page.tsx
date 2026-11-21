import Link from "next/link";
import { Formulario, Campo } from "@/components/Formulario";
import { PantallaAcceso } from "@/components/PantallaAcceso";
import { entrar } from "@/lib/acciones-auth";

export default function Login() {
  return (
    <PantallaAcceso titulo="Bienvenido de vuelta" subtitulo="Entra para ver cómo van tus costos y tus precios.">
      <Formulario accion={entrar} boton="Entrar" className="flex flex-col gap-4">
        <Campo nombre="correo" etiqueta="Correo" tipo="email" />
        <Campo nombre="clave" etiqueta="Contraseña" tipo="password" />
      </Formulario>
      <p className="mt-6 text-sm text-ink-2">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-accent-ink underline">
          Registra tu empresa
        </Link>
      </p>
    </PantallaAcceso>
  );
}
