import Link from "next/link";
import type { PublicacionListada } from "@/lib/publicaciones-tipos";
import { antiguedad } from "@/lib/tiempo";
import { EtiquetaTipo } from "./EtiquetaTipo";
import { Oficio } from "./Oficio";

/**
 * Fila del listado (7.1). Arranca con el dibujo del oficio, que se reconoce antes de leer
 * (decisión 19/09/2026). Sin tarjeta: líneas finas.
 */
export function FilaPublicacion({ p }: { p: PublicacionListada }) {
  const esOfrezco = p.tipo === "ofrezco";
  // En un "necesito" no hay subtipo: si el rubro es "Otros", va el dibujo de servicios.
  const familia = p.subtipo;
  const quien = [p.persona_nombre, p.zona, antiguedad(p.creada_en)].filter(Boolean).join(", ");

  return (
    <Link href={`/p/${p.id}`} className="flex gap-3 border-b divisor py-4">
      <Oficio rubro={p.rubro} familia={familia} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-dorado-oscuro">{p.rubro}</p>
        <h3 className="mt-0.5 text-[17px] font-semibold leading-snug text-pretty">{p.titulo}</h3>

        {p.descripcion && <p className="mt-1 line-clamp-2 text-texto-2">{p.descripcion}</p>}

        {p.precio_texto && <p className="mt-1 font-semibold">{p.precio_texto}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-texto-2">
          <EtiquetaTipo tipo={p.tipo} />
          <span>{quien}</span>
          {esOfrezco && p.subtipo === "servicio" && p.concretados > 0 && (
            <span>
              {p.concretados === 1 ? "1 trabajo concretado" : `${p.concretados} trabajos concretados`}
            </span>
          )}
          {esOfrezco && p.subtipo === "producto" && p.contactos_mes > 0 && (
            <span>
              {p.contactos_mes === 1
                ? "1 persona pidió contacto este mes"
                : `${p.contactos_mes} personas pidieron contacto este mes`}
            </span>
          )}
        </div>
      </div>

      {p.foto_url && (
        // eslint-disable-next-line @next/next/no-img-element -- foto ya comprimida a < 200 KB (R03)
        <img
          src={p.foto_url}
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 self-center rounded object-cover"
        />
      )}
      <span aria-hidden className="self-center text-xl text-texto-2">
        ›
      </span>
    </Link>
  );
}
