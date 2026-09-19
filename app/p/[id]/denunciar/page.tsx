import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOTIVOS_DENUNCIA } from "@/lib/denuncias";
import { obtenerDetalle } from "@/lib/detalle";
import { denunciarPublicacion } from "../acciones";
import { BotonEnviar } from "../../../componentes/BotonEnviar";

export const metadata: Metadata = { title: "Denunciar · Humanitas" };

// Denunciar (10.5, E3). Se puede sin cuenta; con dos denuncias de personas distintas la
// publicación se oculta hasta que la vea el operador (R09).
export default async function PaginaDenunciar({ params, searchParams }: PageProps<"/p/[id]/denunciar">) {
  const { id } = await params;
  const p = await obtenerDetalle(id);
  if (!p) notFound();
  const error = (await searchParams).error;

  return (
    <main className="contenedor flex flex-1 flex-col gap-5">
      <Link href={`/p/${id}`} className="text-dorado-oscuro underline">
        ‹ Volver
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="titulo">Denunciar esta publicación</h1>
        <p className="text-texto-2">{p.titulo}</p>
      </div>

      <form action={denunciarPublicacion} className="flex flex-col gap-5">
        <input type="hidden" name="publicacionId" value={id} />

        <fieldset className="flex flex-col gap-3">
          <legend className="etiqueta">¿Qué pasa con esta publicación?</legend>
          {MOTIVOS_DENUNCIA.map((m) => (
            <label key={m.valor} className="flex min-h-12 items-center gap-3">
              <input type="radio" name="motivo" value={m.valor} className="check" />
              <span>{m.texto}</span>
            </label>
          ))}
        </fieldset>
        {error === "motivo" && <p className="texto-error">Todavía falta elegir un motivo.</p>}
        {error === "limite" && (
          <p className="aviso-error text-error" role="alert">
            Hoy llegaron muchas denuncias desde esta conexión. Mañana vas a poder enviar otra.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="detalle" className="etiqueta">
            Qué pasó (si querés contarlo)
          </label>
          <textarea id="detalle" name="detalle" className="campo min-h-24 py-3" maxLength={500} rows={3} />
        </div>

        <BotonEnviar enviando="Enviando…">Enviar la denuncia</BotonEnviar>
        <p className="text-sm text-texto-2">
          La revisa una persona del equipo de Humanitas en menos de 24 horas. Si alguien está en
          peligro, también conviene llamar al 911.
        </p>
      </form>
    </main>
  );
}
