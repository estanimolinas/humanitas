import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerDetalle } from "@/lib/detalle";
import { personaActual } from "@/lib/sesion/actual";
import { antiguedad } from "@/lib/tiempo";
import { LIMITE_CONTACTOS_POR_DIA } from "@/lib/whatsapp";
import { AvisoConfianza } from "../../componentes/AvisoConfianza";
import { EtiquetaTipo } from "../../componentes/EtiquetaTipo";
import { contactarPorWhatsApp } from "./acciones";

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const p = await obtenerDetalle((await params).id);
  return { title: p ? `${p.titulo} · Humanitas` : "Humanitas" };
}

// Detalle de publicación (7.2). Se ve sin cuenta; para contactar se pide el alta (R04).
export default async function PaginaDetalle({ params, searchParams }: PageProps<"/p/[id]">) {
  const { id } = await params;
  const q = await searchParams;
  const p = await obtenerDetalle(id);
  if (!p) notFound();

  const persona = await personaActual();
  const esOfrezco = p.tipo === "ofrezco";
  const datos = [
    p.precioTexto ? { k: esOfrezco ? "Precio" : "Paga", v: p.precioTexto } : null,
    p.aliasPago ? { k: "Alias para pagar", v: p.aliasPago } : null,
  ].filter((d): d is { k: string; v: string } => d !== null);

  return (
    <main className="contenedor flex flex-1 flex-col gap-4">
      <Link href="/" className="text-dorado-oscuro underline">
        ‹ Volver
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <EtiquetaTipo tipo={p.tipo} />
          <p className="pt-px text-sm text-texto-2">{p.rubroOtroTexto ?? p.rubro}</p>
        </div>
        <h1 className="titulo">{p.titulo}</h1>
      </div>

      <div className="flex justify-between gap-3 border-y divisor py-3">
        <div className="min-w-0">
          <p className="font-semibold">{p.personaNombre}</p>
          {esOfrezco && p.subtipo === "servicio" && p.concretados > 0 && (
            <p className="text-sm text-texto-2">
              {p.concretados === 1 ? "1 trabajo concretado" : `${p.concretados} trabajos concretados`}
            </p>
          )}
          {esOfrezco && p.subtipo === "producto" && p.contactosMes > 0 && (
            <p className="text-sm text-texto-2">
              {p.contactosMes === 1
                ? "1 persona pidió contacto este mes"
                : `${p.contactosMes} personas pidieron contacto este mes`}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right text-sm text-texto-2">
          {p.zona && <p>{p.zona}</p>}
          <p>Publicado {antiguedad(p.creadaEn)}</p>
        </div>
      </div>

      {p.fotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- foto propia, ya comprimida (R03)
        <img src={p.fotoUrl} alt={p.titulo} className="w-full rounded-lg object-cover" />
      )}

      {p.descripcion && <p className="text-pretty">{p.descripcion}</p>}

      {datos.length > 0 && (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[color-mix(in_srgb,#201f1d_16%,transparent)] bg-[color-mix(in_srgb,#201f1d_16%,transparent)]">
          {datos.map((d) => (
            <div key={d.k} className="bg-fondo p-3">
              <dt className="etiqueta">{d.k}</dt>
              <dd className="mt-1">{d.v}</dd>
            </div>
          ))}
        </dl>
      )}

      {q.limite && (
        <p className="aviso-error text-error" role="alert">
          Por hoy llegaste a los {LIMITE_CONTACTOS_POR_DIA} contactos. Mañana vas a poder seguir.
        </p>
      )}

      {q.propia && <p className="aviso">Esta publicación es tuya.</p>}

      {q.contactar && persona && (
        <p className="aviso">Gracias, {persona.nombre}. Tu cuenta ya está lista para contactar.</p>
      )}

      <form action={contactarPorWhatsApp}>
        <input type="hidden" name="publicacionId" value={p.id} />
        <button type="submit" className="boton-principal">
          Contactar por WhatsApp
        </button>
      </form>

      <p className="text-sm text-texto-2">
        {persona
          ? "Se abre WhatsApp con un mensaje ya escrito."
          : "Para contactar se pide tu nombre y tu celular, así quien publicó sabe quién le escribe."}
      </p>

      <AvisoConfianza />

      {/* Acción discreta, como pide 7.2 */}
      <Link href={`/p/${p.id}/denunciar`} className="mt-2 text-sm text-texto-2 underline">
        Denunciar esta publicación
      </Link>
    </main>
  );
}
