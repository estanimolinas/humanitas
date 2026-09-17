import Link from "next/link";
import type { Rubro } from "@/lib/rubros";
import type { Subtipo, Tipo } from "@/lib/publicaciones-tipos";

type Estado = { tipo: Tipo; subtipo?: Subtipo | null; rubroId?: number | null };

function url({ tipo, subtipo, rubroId }: Estado) {
  const p = new URLSearchParams();
  if (tipo === "ofrezco") p.set("tipo", "ofrezco");
  if (subtipo) p.set("subtipo", subtipo);
  if (rubroId) p.set("rubro", String(rubroId));
  const q = p.toString();
  return q ? `/?${q}` : "/";
}

const solapa = (activa: boolean) =>
  `flex min-h-12 flex-1 items-center justify-center text-[17px] font-semibold ${
    activa ? "bg-dorado-claro text-dorado-profundo" : "text-texto-2"
  }`;

const chip = (activo: boolean) =>
  `flex min-h-11 items-center rounded-full border px-3 text-sm whitespace-nowrap ${
    activo
      ? "border-dorado bg-dorado-claro text-dorado-profundo"
      : "border-borde-campo text-texto-2"
  }`;

/** Solapas Necesitan / Ofrecen, subtipo y chips de rubro (7.1). Son links: andan sin JavaScript. */
export function Filtros({ estado, rubros }: { estado: Estado; rubros: Rubro[] }) {
  const { tipo } = estado;
  const subtipo = estado.subtipo ?? null;
  const rubroId = estado.rubroId ?? null;
  // En "Ofrecen" los rubros se muestran según la familia elegida; en "Necesitan", todos.
  const rubrosVisibles = subtipo ? rubros.filter((r) => r.familia === subtipo) : rubros;

  return (
    <div className="flex flex-col gap-3">
      <nav
        aria-label="Qué querés ver"
        className="flex overflow-hidden rounded-[10px] border border-borde-campo"
      >
        <Link
          href={url({ tipo: "necesito", subtipo: null, rubroId })}
          aria-current={tipo === "necesito" ? "page" : undefined}
          className={solapa(tipo === "necesito")}
        >
          Necesitan
        </Link>
        <Link
          href={url({ tipo: "ofrezco", subtipo, rubroId })}
          aria-current={tipo === "ofrezco" ? "page" : undefined}
          className={`${solapa(tipo === "ofrezco")} border-l border-borde-campo`}
        >
          Ofrecen
        </Link>
      </nav>

      {tipo === "ofrezco" && (
        <nav aria-label="Servicios o productos" className="flex flex-wrap gap-2">
          {[
            { valor: null, texto: "Todos" },
            { valor: "servicio" as Subtipo, texto: "Servicios" },
            { valor: "producto" as Subtipo, texto: "Productos" },
          ].map((o) => (
            <Link
              key={o.texto}
              href={url({
                tipo,
                subtipo: o.valor,
                // Si cambia la familia, el rubro elegido deja de aplicar.
                rubroId: o.valor && rubros.find((r) => r.id === rubroId)?.familia !== o.valor ? null : rubroId,
              })}
              aria-current={subtipo === o.valor ? "page" : undefined}
              className={chip(subtipo === o.valor)}
            >
              {o.texto}
            </Link>
          ))}
        </nav>
      )}

      <nav aria-label="Rubros" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <Link
          href={url({ tipo, subtipo, rubroId: null })}
          aria-current={rubroId === null ? "page" : undefined}
          className={chip(rubroId === null)}
        >
          Todos los rubros
        </Link>
        {rubrosVisibles.map((r) => (
          <Link
            key={r.id}
            href={url({ tipo, subtipo, rubroId: r.id })}
            aria-current={rubroId === r.id ? "page" : undefined}
            className={chip(rubroId === r.id)}
          >
            {r.nombre}
          </Link>
        ))}
      </nav>
    </div>
  );
}
