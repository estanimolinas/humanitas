import Link from "next/link";
import type { PublicacionListada } from "@/lib/publicaciones-tipos";
import { antiguedad } from "@/lib/tiempo";
import { EtiquetaTipo } from "./EtiquetaTipo";

/** Fila del listado (7.1). Sin tarjeta, líneas finas y la composición del mockup. */
export function FilaPublicacion({ p }: { p: PublicacionListada }) {
  const esOfrezco = p.tipo === "ofrezco";
  const meta = [p.rubro, p.zona, antiguedad(p.creada_en)].filter(Boolean).join(" · ");

  return (
    <Link href={`/p/${p.id}`} className="flex gap-3 border-b divisor py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <EtiquetaTipo tipo={p.tipo} />
          <p className="pt-px text-sm text-texto-2">{meta}</p>
        </div>

        <h3 className="mt-2 text-[17px] font-semibold leading-snug text-pretty">{p.titulo}</h3>

        {p.descripcion && <p className="mt-1 line-clamp-2 text-texto-2">{p.descripcion}</p>}

        {p.precio_texto && <p className="mt-1 font-semibold">{p.precio_texto}</p>}

        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-sm">
          <span className="text-texto-2">{p.persona_nombre}</span>
          {/* Solo se muestra cuando está verificada (decisión I del 15/09) */}
          {p.verificado_lugar && (
            <span className="text-dorado-oscuro">✓ Verificado en {p.verificado_lugar}</span>
          )}
          {esOfrezco && p.subtipo === "servicio" && p.concretados > 0 && (
            <span className="text-texto-2">
              {p.concretados === 1 ? "1 trabajo concretado" : `${p.concretados} trabajos concretados`}
            </span>
          )}
          {esOfrezco && p.subtipo === "producto" && p.contactos_mes > 0 && (
            <span className="text-texto-2">
              {p.contactos_mes === 1
                ? "1 persona pidió contacto este mes"
                : `${p.contactos_mes} personas pidieron contacto este mes`}
            </span>
          )}
        </p>
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
