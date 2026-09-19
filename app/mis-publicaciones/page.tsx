import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { perfilPropio, publicacionesPropias, type PublicacionPropia } from "@/lib/mis-publicaciones";
import { personaActual } from "@/lib/sesion/actual";
import { antiguedad } from "@/lib/tiempo";
import { Iniciales } from "../componentes/Iniciales";
import { Oficio } from "../componentes/Oficio";
import { cerrar, cerrarSesion, reactivar } from "./acciones";
import { BotonEnviar } from "../componentes/BotonEnviar";

export const metadata: Metadata = { title: "Mis publicaciones · Humanitas" };

const AVISOS: Record<string, string> = {
  cerrada: "La publicación se cerró y ya no aparece en el listado.",
  reactivada: "La publicación volvió al listado.",
  editada: "Los cambios se guardaron.",
  datos: "Tus datos se guardaron.",
};

// Los errores llegan como código en la URL y el texto sale de acá: nadie puede hacerle decir a la
// app un mensaje armado en un link.
const ERRORES: Record<string, string> = {
  no_es_tuya: "Esta publicación es de otra persona.",
  no_esta_activa: "Esta publicación ya estaba cerrada.",
  no_esta_cerrada: "Esta publicación ya está activa.",
  no_te_contacto: "Esa persona no te contactó por esta publicación.",
  motivo_invalido: "Todavía falta elegir una de las opciones.",
  limite_activas: "Ya tenés 20 publicaciones activas, que es el tope. Si cerrás alguna, podés reactivar esta.",
  no_se_pudo_editar: "No pudimos guardar los cambios. ¿Probamos de nuevo?",
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
      <div className="flex items-start gap-3">
        <Oficio rubro={p.rubro} familia={p.subtipo} tamanio="size-10" />
        <h3 className="min-w-0 flex-1 pt-1.5 text-[17px] font-semibold text-pretty">{p.titulo}</h3>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
            p.estado === "activa" ? "border-dorado text-dorado-oscuro" : "border-borde-campo text-texto-2"
          }`}
        >
          {ESTADOS[p.estado]}
        </span>
      </div>

      <p className="text-sm text-texto-2">
        {[
          esNecesito ? "Necesito" : "Ofrezco",
          p.rubro,
          p.zona,
          antiguedad(p.creadaEn),
          p.contactos === 1 ? "1 contacto" : `${p.contactos} contactos`,
        ]
          .filter(Boolean)
          .join(", ")}
      </p>

      {/* Las acciones en partes iguales: en el celular no quedan en renglones desparejos. */}
      <div className="grid auto-cols-fr grid-flow-col gap-2">
        <Link href={`/p/${p.id}`} className="boton-secundario">
          Ver
        </Link>
        {p.estado === "activa" && (
          <>
            <Link href={`/mis-publicaciones/${p.id}/editar`} className="boton-secundario">
              Editar
            </Link>
            {esNecesito ? (
              <Link href={`/mis-publicaciones/${p.id}/cerrar`} className="boton-secundario">
                Cerrar
              </Link>
            ) : (
              <form action={cerrar}>
                <input type="hidden" name="publicacionId" value={p.id} />
                <input type="hidden" name="motivo" value="cerrada_por_duenio" />
                <BotonEnviar enviando="Cerrando…" className="boton-secundario">
                  Cerrar
                </BotonEnviar>
              </form>
            )}
          </>
        )}
        {(p.estado === "cerrada" || p.estado === "archivada") && (
          <form action={reactivar}>
            <input type="hidden" name="publicacionId" value={p.id} />
            <BotonEnviar enviando="Publicando…" className="boton-secundario">
              Volver a publicar
            </BotonEnviar>
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
  const error = typeof q.error === "string" ? (ERRORES[q.error] ?? null) : null;
  const [publicaciones, perfil] = await Promise.all([
    publicacionesPropias(persona.id),
    perfilPropio(persona.id),
  ]);
  const desde = new Date(perfil.desde).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Cordoba",
  });

  return (
    <main className="contenedor flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-4">
        <Iniciales nombre={persona.nombre} grande />
        <div className="min-w-0">
          <h1 className="titulo">{persona.nombre}</h1>
          <p className="text-sm text-texto-2">
            {perfil.barrio ? `${perfil.barrio} · ` : ""}desde {desde}
          </p>
        </div>
      </div>

      <div className="flex gap-5">
        <Link href="/mis-publicaciones/datos" className="text-dorado-oscuro underline">
          Mis datos
        </Link>
        <Link href="/ayuda" className="text-dorado-oscuro underline">
          Ayuda
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
          <p className="aviso">Todavía no tenés publicaciones. Cuando publiques algo, lo vas a ver acá.</p>
          <Link href="/publicar" className="boton-principal">
            Publicar
          </Link>
        </div>
      ) : (
        <section className="flex flex-col gap-2">
          <h2 className="etiqueta">Mis publicaciones</h2>
          <div className="border-t divisor">
            {publicaciones.map((p) => (
              <Publicacion key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <p className="text-sm text-texto-2">
        Guardamos lo mínimo: tu nombre, tu celular y lo que publicás.
      </p>

      <form action={cerrarSesion} className="border-t divisor pt-4">
        <BotonEnviar enviando="Cerrando la sesión…" className="min-h-11 text-texto-2 underline">
          Cerrar sesión en este celular
        </BotonEnviar>
      </form>
    </main>
  );
}
