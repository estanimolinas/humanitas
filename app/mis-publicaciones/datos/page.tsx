import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { personaActual } from "@/lib/sesion/actual";
import { zonasParaElegir } from "@/lib/zonas";
import { FormularioDatos } from "./FormularioDatos";

export const metadata: Metadata = { title: "Mis datos · Humanitas" };

export default async function PaginaDatos({ searchParams }: PageProps<"/mis-publicaciones/datos">) {
  const persona = await personaActual();
  if (!persona) redirect("/alta?volver=%2Fmis-publicaciones%2Fdatos");

  const zonas = await zonasParaElegir();
  const error = (await searchParams).error;

  return (
    <main className="contenedor flex flex-1 flex-col gap-5">
      <Link href="/mis-publicaciones" className="text-dorado-oscuro underline">
        ‹ Volver
      </Link>
      <h1 className="titulo">Mis datos</h1>
      <FormularioDatos
        nombreInicial={persona.nombre}
        zonaInicial={persona.zonaId}
        zonas={zonas}
        error={typeof error === "string" ? error : null}
      />
    </main>
  );
}
