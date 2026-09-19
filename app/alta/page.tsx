import type { Metadata } from "next";
import Link from "next/link";
import { volverSeguro } from "@/lib/alta";
import { personaActual } from "@/lib/sesion/actual";
import { zonasParaElegir } from "@/lib/zonas";
import { FormularioAlta } from "./FormularioAlta";

export const metadata: Metadata = { title: "Crear tu cuenta · Humanitas" };

// Alta mínima (7.5). Se llega acá solo al intentar publicar o contactar, y vuelve a donde estaba.
export default async function PaginaAlta({ searchParams }: PageProps<"/alta">) {
  const volver = volverSeguro((await searchParams).volver);
  const persona = await personaActual();

  if (persona) {
    return (
      <main className="contenedor flex flex-1 flex-col gap-4">
        <h1 className="titulo">Ya tenés tu cuenta, {persona.nombre}.</h1>
        <Link href={volver} className="boton-principal">
          Seguir
        </Link>
      </main>
    );
  }

  return (
    <main className="contenedor flex flex-1 flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="titulo">Crear tu cuenta</h1>
        <p className="text-texto-2">Lleva un minuto y no necesita contraseña.</p>
      </div>
      <FormularioAlta zonas={await zonasParaElegir()} volver={volver} />
    </main>
  );
}
