import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { publicacionesPropias } from "@/lib/mis-publicaciones";
import { personaActual } from "@/lib/sesion/actual";
import { zonasParaElegir } from "@/lib/zonas";
import { ELEGIR_BARRIO } from "@/lib/zonas-config";
import { MAX_DESCRIPCION, MAX_TITULO } from "@/lib/validar-publicacion";
import { editar } from "../../acciones";
import { BotonEnviar } from "../../../componentes/BotonEnviar";

export const metadata: Metadata = { title: "Editar publicación · Humanitas" };

export default async function PaginaEditar({ params, searchParams }: PageProps<"/mis-publicaciones/[id]/editar">) {
  const { id } = await params;
  const persona = await personaActual();
  if (!persona) redirect(`/alta?volver=${encodeURIComponent(`/mis-publicaciones/${id}/editar`)}`);

  const p = (await publicacionesPropias(persona.id)).find((x) => x.id === id);
  if (!p) notFound();
  const zonas = await zonasParaElegir();
  const error = (await searchParams).error;

  return (
    <main className="contenedor flex flex-1 flex-col gap-5">
      <Link href="/mis-publicaciones" className="text-dorado-oscuro underline">
        ‹ Volver
      </Link>
      <h1 className="titulo">Editar</h1>

      <form action={editar} className="flex flex-col gap-5">
        <input type="hidden" name="publicacionId" value={id} />

        <div className="flex flex-col gap-2">
          <label htmlFor="titulo" className="etiqueta">
            Título corto
          </label>
          <input
            id="titulo"
            name="titulo"
            className="campo"
            defaultValue={p.titulo}
            maxLength={MAX_TITULO}
          />
          {error === "titulo" && <p className="texto-error">Nos falta un título de hasta 60 caracteres.</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="descripcion" className="etiqueta">
            Detalle
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            className="campo min-h-28 py-3"
            defaultValue={p.descripcion ?? ""}
            maxLength={MAX_DESCRIPCION}
            rows={4}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="precioTexto" className="etiqueta">
            Precio
          </label>
          <input
            id="precioTexto"
            name="precioTexto"
            className="campo"
            defaultValue={p.precioTexto ?? ""}
            maxLength={80}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="aliasPago" className="etiqueta">
            Alias para que te paguen
          </label>
          <input
            id="aliasPago"
            name="aliasPago"
            className="campo"
            defaultValue={p.aliasPago ?? ""}
            maxLength={80}
          />
        </div>

        {!ELEGIR_BARRIO ? (
          <input type="hidden" name="zonaId" value={p.zonaId ? String(p.zonaId) : ""} />
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor="zonaId" className="etiqueta">
              Barrio
            </label>
            <select id="zonaId" name="zonaId" className="campo" defaultValue={p.zonaId ? String(p.zonaId) : ""}>
              <option value="">Sin barrio</option>
              {zonas.map((g) => (
                <optgroup key={g.localidad} label={g.localidad}>
                  {g.barrios.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-sm text-texto-2">El barrio ordena el listado; tu publicación aparece igual en todos.</p>
          </div>
        )}

        <BotonEnviar enviando="Guardando…">Guardar cambios</BotonEnviar>
      </form>
    </main>
  );
}
