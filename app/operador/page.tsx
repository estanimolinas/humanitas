import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { colaDelOperador, ultimasAcciones } from "@/lib/operador";
import { personaActual } from "@/lib/sesion/actual";
import { antiguedad } from "@/lib/tiempo";
import { resolver } from "./acciones";

export const metadata: Metadata = { title: "Operador · Humanitas" };

const MOTIVOS: Record<string, string> = {
  estafa: "Estafa",
  contenido_inapropiado: "Contenido inapropiado",
  posible_menor: "Posible menor de edad",
  otro: "Otro",
};

// Cola de denuncias (R09, R24 mínimo). "Posible menor" va primero (R16).
export default async function PaginaOperador({ searchParams }: PageProps<"/operador">) {
  const persona = await personaActual();
  // No es "ocultar el botón": si no sos operador, esta pantalla no existe.
  if (!persona?.esOperador) notFound();

  const q = await searchParams;
  const [cola, acciones] = await Promise.all([colaDelOperador(), ultimasAcciones()]);

  return (
    <main className="contenedor flex flex-1 flex-col gap-5">
      <h1 className="titulo">Denuncias</h1>

      {q.listo && <p className="aviso">Resuelta. Quedó registrada en el historial.</p>}
      {typeof q.error === "string" && (
        <p className="aviso-error text-error" role="alert">
          {q.error}
        </p>
      )}

      {cola.length === 0 ? (
        <p className="aviso">No hay denuncias sin resolver.</p>
      ) : (
        <div className="flex flex-col">
          {cola.map((p) => (
            <article key={p.id} className="flex flex-col gap-3 border-b divisor py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-[17px] font-semibold">{p.titulo}</h2>
                {p.posibleMenor && (
                  <span className="rounded-full border border-error px-3 py-1 text-sm text-error">
                    Posible menor · prioridad
                  </span>
                )}
              </div>
              <p className="text-sm text-texto-2">
                {p.tipo === "necesito" ? "Necesito" : "Ofrezco"} · {p.personaNombre} · estado: {p.estado}
              </p>
              {p.descripcion && <p className="text-texto-2">{p.descripcion}</p>}

              <ul className="flex flex-col gap-1">
                {p.denuncias.map((d) => (
                  <li key={d.id} className="text-sm">
                    <strong>{MOTIVOS[d.motivo] ?? d.motivo}</strong> · {antiguedad(d.creadaEn)}
                    {d.anonima ? " · sin cuenta" : ""}
                    {d.detalle ? ` · "${d.detalle}"` : ""}
                  </li>
                ))}
              </ul>

              <Link href={`/p/${p.id}`} className="text-dorado-oscuro underline">
                Ver la publicación
              </Link>

              <form action={resolver} className="flex flex-col gap-3">
                <input type="hidden" name="publicacionId" value={p.id} />
                <label htmlFor={`resolucion-${p.id}`} className="etiqueta">
                  Qué decidiste y por qué
                </label>
                <input id={`resolucion-${p.id}`} name="resolucion" className="campo" maxLength={500} />
                <div className="flex flex-wrap gap-2">
                  <button type="submit" name="accion" value="archivar" className="boton-principal max-w-[16rem]">
                    Archivar la publicación
                  </button>
                  <button type="submit" name="accion" value="reactivar" className="boton-secundario max-w-[16rem]">
                    Devolverla al listado
                  </button>
                </div>
              </form>
            </article>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-2 border-t divisor pt-4">
        <h2 className="kicker">Historial de intervenciones</h2>
        <p className="text-sm text-texto-2">
          Todo lo que hace el operador queda acá, para que nadie pueda decir que se favoreció a
          alguien.
        </p>
        <ul className="flex flex-col gap-1 text-sm">
          {acciones.map((a) => (
            <li key={a.id}>
              {antiguedad(a.creadaEn)} · {a.operador} · {a.accion} · {a.objetivoTipo}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
