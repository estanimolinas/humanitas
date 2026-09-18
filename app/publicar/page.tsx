import type { Metadata } from "next";
import { rubrosActivos } from "@/lib/rubros";
import { personaActual } from "@/lib/sesion/actual";
import { zonasParaElegir } from "@/lib/zonas";
import { FormularioPublicar } from "./FormularioPublicar";

export const metadata: Metadata = { title: "Publicar · Humanitas" };

// Publicar (7.3): pasos cortos. El alta mínima aparece al final, si hace falta (B4).
export default async function PaginaPublicar() {
  const [persona, rubros, zonas] = await Promise.all([
    personaActual(),
    rubrosActivos(),
    zonasParaElegir(),
  ]);

  return (
    <main className="contenedor flex flex-1 flex-col gap-5">
      <h1 className="titulo">Publicar</h1>
      <FormularioPublicar
        rubros={rubros}
        zonas={zonas}
        tieneCuenta={persona !== null}
        nombrePersona={persona?.nombre ?? null}
      />
    </main>
  );
}
