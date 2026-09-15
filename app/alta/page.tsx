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
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-5">
        <h1 className="text-2xl font-bold">Ya tenés tu cuenta, {persona.nombre}.</h1>
        <Link href={volver} className="rounded-lg bg-zinc-900 px-4 py-4 text-center text-lg font-semibold text-white">
          Seguir
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Creá tu cuenta</h1>
        <p className="text-lg">Es un minuto. No hace falta contraseña.</p>
      </div>
      <FormularioAlta zonas={await zonasParaElegir()} volver={volver} />
    </main>
  );
}
