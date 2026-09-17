import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerDetalle } from "@/lib/detalle";
import { personaActual } from "@/lib/sesion/actual";
import { antiguedad } from "@/lib/tiempo";
import { LIMITE_CONTACTOS_POR_DIA } from "@/lib/whatsapp";
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
    p.zona ? { k: "Barrio", v: p.zona } : null,
    { k: "Publicado", v: antiguedad(p.creadaEn) },
    p.aliasPago ? { k: "Alias para pagar", v: p.aliasPago } : null,
  ].filter((d): d is { k: string; v: string } => d !== null);

  return (
    <main className="contenedor flex flex-1 flex-col gap-4">
      <Link href="/" className="text-dorado-oscuro underline">
        ‹ Volver
      </Link>

      <div className="flex flex-col gap-2">
        <p className="kicker">
          {esOfrezco ? "Ofrezco" : "Necesito"} · {p.rubroOtroTexto ?? p.rubro}
        </p>
        <h1 className="titulo">{p.titulo}</h1>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 border-y divisor py-3">
        <div>
          <p className="font-semibold">{p.personaNombre}</p>
          {p.verificadoLugar ? (
            <p className="text-sm text-dorado-oscuro">✓ Verificado en {p.verificadoLugar}</p>
          ) : (
            <p className="text-sm text-texto-2">Sin verificación presencial todavía</p>
          )}
        </div>
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
          Llegaste al límite de {LIMITE_CONTACTOS_POR_DIA} contactos por día. Probá de nuevo mañana.
        </p>
      )}

      {q.contactar && persona && (
        <p className="aviso">Listo, {persona.nombre}. Ya podés contactar.</p>
      )}

      <form action={contactarPorWhatsApp}>
        <input type="hidden" name="publicacionId" value={p.id} />
        <button type="submit" className="boton-principal">
          Contactar por WhatsApp
        </button>
      </form>

      <p className="text-sm text-texto-2">
        {persona
          ? "Se abre WhatsApp con el mensaje escrito. Humanitas no participa del acuerdo: el precio lo arreglan entre ustedes."
          : "Para contactar hace falta dejar tu celular: así quien te atiende también sabe quién le escribe."}
      </p>
    </main>
  );
}
