import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { publicacionesPropias, type PublicacionPropia } from "@/lib/mis-publicaciones";
import { personaActual } from "@/lib/sesion/actual";
import { antiguedad } from "@/lib/tiempo";
import { cerrar, reactivar } from "./acciones";

export const metadata: Metadata = { title: "Mis publicaciones · Humanitas" };

const AVISOS: Record<string, string> = {
  cerrada: "La publicación se cerró y ya no aparece en el listado.",
  reactivada: "La publicación volvió al listado.",
  editada: "Los cambios se guardaron.",
  datos: "Tus datos se guardaron.",
};

const ESTADOS: Record<PublicacionPropia["estado"], string> = {
  activa: "Activa",
  cerrada: "Cerrada",
  en_revision: "En revisión",
  archivada: "Archivada",
};

function Publicacion({ p }: { p: PublicacionPropia }) {
  const esNecesito = p.tipo === "necesito";
  return (
    <article className="flex flex-col gap-2 border-b divisor py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-[17px] font-semibold text-pretty">{p.titulo}</h3>
        <span
          className={`rounded-full border px-3 py-1 text-sm ${
            p.estado === "activa" ? "border-dorado text-dorado-oscuro" : "border-borde-campo text-texto-2"
          }`}
        >
          {ESTADOS[p.estado]}
        </span>
      </div>

      <p className="text-sm text-texto-2">
        {esNecesito ? "Necesito" : "Ofrezco"} · {p.rubro}
        {p.zona ? ` · ${p.zona}` : ""} · {antiguedad(p.creadaEn)} ·{" "}
        {p.contactos === 1 ? "1 contacto" : `${p.contactos} contactos`}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link href={`/p/${p.id}`} className="boton-secundario max-w-[9rem]">
          Ver
        </Link>
        {p.estado === "activa" && (
          <>
            <Link href={`/mis-publicaciones/${p.id}/editar`} className="boton-secundario max-w-[9rem]">
              Editar
            </Link>
            {esNecesito ? (
              <Link href={`/mis-publicaciones/${p.id}/cerrar`} className="boton-secundario max-w-[9rem]">
                Cerrar
              </Link>
            ) : (
              <form action={cerrar}>
                <input type="hidden" name="publicacionId" value={p.id} />
                <input type="hidden" name="motivo" value="cerrada_por_duenio" />
                <button type="submit" className="boton-secundario max-w-[9rem]">
                  Cerrar
                </button>
              </form>
            )}
          </>
        )}
        {(p.estado === "cerrada" || p.estado === "archivada") && (
          <form action={reactivar}>
            <input type="hidden" name="publicacionId" value={p.id} />
            <button type="submit" className="boton-secundario max-w-[12rem]">
              Volver a publicar
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

// Mis publicaciones (7.4). El proxy ya pide cuenta para entrar acá.
export default async function PaginaMisPublicaciones({ searchParams }: PageProps<"/mis-publicaciones">) {
  const persona = await personaActual();
  if (!persona) redirect("/alta?volver=%2Fmis-publicaciones");

  const q = await searchParams;
  const listo = typeof q.listo === "string" ? AVISOS[q.listo] : null;
  const error = typeof q.error === "string" ? q.error : null;
  const publicaciones = await publicacionesPropias(persona.id);

  return (
    <main className="contenedor flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo">Mis publicaciones</h1>
        <Link href="/mis-publicaciones/datos" className="text-dorado-oscuro underline">
          Mis datos
        </Link>
      </div>

      {listo && <p className="aviso">{listo}</p>}
      {error && (
        <p className="aviso-error text-error" role="alert">
          {error}
        </p>
      )}

      {publicaciones.length === 0 ? (
        <div className="flex flex-col gap-3">
          <p className="aviso">Todavía no tenés publicaciones.</p>
          <Link href="/publicar" className="boton-principal boton-suelto">
            Publicar
          </Link>
        </div>
      ) : (
        <div className="border-t divisor">
          {publicaciones.map((p) => (
            <Publicacion key={p.id} p={p} />
          ))}
        </div>
      )}
    </main>
  );
}
