import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { publicacionesPropias, quienesContactaron } from "@/lib/mis-publicaciones";
import { personaActual } from "@/lib/sesion/actual";
import { antiguedad } from "@/lib/tiempo";
import { Cita } from "../../../componentes/Cita";
import { cerrar } from "../../acciones";
import { BotonEnviar } from "../../../componentes/BotonEnviar";

export const metadata: Metadata = { title: "Cerrar publicación · Humanitas" };

// Cierre de un "necesito" (7.4): "¿Lo resolviste?". Solo desde acá sube el contador de
// concretados de la otra persona (8.4, D2).
export default async function PaginaCerrar({ params, searchParams }: PageProps<"/mis-publicaciones/[id]/cerrar">) {
  const { id } = await params;
  const persona = await personaActual();
  if (!persona) redirect(`/alta?volver=${encodeURIComponent(`/mis-publicaciones/${id}/cerrar`)}`);

  const propia = (await publicacionesPropias(persona.id)).find((p) => p.id === id);
  if (!propia || propia.tipo !== "necesito" || propia.estado !== "activa") notFound();

  const gente = await quienesContactaron(id, persona.id);
  const falta = typeof (await searchParams).falta === "string";

  return (
    <main className="contenedor flex flex-1 flex-col gap-5">
      <Link href="/mis-publicaciones" className="text-dorado-oscuro underline">
        ‹ Volver
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="titulo">¿Lo resolviste?</h1>
        <p className="text-texto-2">{propia.titulo}</p>
      </div>

      {falta && (
        <p className="aviso-error text-error" role="alert">
          Todavía falta elegir quién hizo el trabajo, así queda reconocido.
        </p>
      )}

      {gente.length > 0 && (
        <form action={cerrar} className="flex flex-col gap-3 border-t divisor pt-4">
          <input type="hidden" name="publicacionId" value={id} />
          <input type="hidden" name="motivo" value="resuelta_con_alguien_de_aca" />
          <h2 className="etiqueta">Sí, con alguien de acá</h2>
          <p className="text-texto-2">A quien elijas se le suma un trabajo concretado.</p>
          {gente.map((g) => (
            <label key={g.id} className="flex min-h-12 items-center gap-3">
              <input type="radio" name="personaQueHizoId" value={g.id} className="check" />
              <span>
                {g.nombre}{" "}
                <span className="text-sm text-texto-2">· te escribió {antiguedad(g.cuando)}</span>
              </span>
            </label>
          ))}
          <BotonEnviar enviando="Cerrando…">Cerrar y reconocer el trabajo</BotonEnviar>
        </form>
      )}

      {gente.length === 0 && (
        <p className="aviso">
          Todavía nadie pidió tu contacto por este pedido, así que no hay a quién reconocerle el
          trabajo.
        </p>
      )}

      <form action={cerrar} className="flex flex-col gap-3 border-t divisor pt-4">
        <input type="hidden" name="publicacionId" value={id} />
        <input type="hidden" name="motivo" value="resuelta_por_otro_lado" />
        <BotonEnviar enviando="Cerrando…" className="boton-secundario">
          Sí, lo resolví por otro lado
        </BotonEnviar>
      </form>

      <form action={cerrar} className="flex flex-col gap-3">
        <input type="hidden" name="publicacionId" value={id} />
        <input type="hidden" name="motivo" value="ya_no_la_necesita" />
        <BotonEnviar enviando="Cerrando…" className="boton-secundario">
          No, ya no lo necesito
        </BotonEnviar>
      </form>

      <Cita
        numero={148}
        tema="Sobre el trabajo"
        texto="a través de él la persona desarrolla muchas dimensiones de su propia existencia"
      />
    </main>
  );
}
