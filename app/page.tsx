import Link from "next/link";
import { contarPublicaciones, listarPublicaciones } from "@/lib/publicaciones";
import type { FiltrosListado, Subtipo } from "@/lib/publicaciones-tipos";
import { rubrosActivos } from "@/lib/rubros";
import { personaActual } from "@/lib/sesion/actual";
import { zonaDelVisitante } from "@/lib/sesion/zona-visitante";
import { zonasParaElegir } from "@/lib/zonas";
import { ELEGIR_BARRIO } from "@/lib/zonas-config";
import { AvisoConfianza } from "./componentes/AvisoConfianza";
import { Bienvenida } from "./componentes/Bienvenida";
import { Cita } from "./componentes/Cita";
import { Filtros } from "./componentes/Filtros";
import { ListaPublicaciones } from "./componentes/ListaPublicaciones";
import { SelectorZona } from "./componentes/SelectorZona";

// Listado (7.1). Se ve sin registrarse y sin pedir ningún permiso (R01).
export default async function Inicio({ searchParams }: PageProps<"/">) {
  const q = await searchParams;
  const primero = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const tipo = primero(q.tipo) === "ofrezco" ? "ofrezco" : "necesito";
  const subtipoCrudo = primero(q.subtipo);
  const subtipo: Subtipo | null =
    tipo === "ofrezco" && (subtipoCrudo === "servicio" || subtipoCrudo === "producto")
      ? subtipoCrudo
      : null;
  const rubroCrudo = Number(primero(q.rubro));
  const rubroId = Number.isInteger(rubroCrudo) && rubroCrudo > 0 ? rubroCrudo : null;

  const filtros: FiltrosListado = { tipo, subtipo, rubroId };

  const persona = await personaActual();
  const zonaVisitante = await zonaDelVisitante();
  const zonaId = persona?.zonaId ?? zonaVisitante;

  const [rubros, zonas, publicaciones, total] = await Promise.all([
    rubrosActivos(),
    zonasParaElegir(),
    listarPublicaciones(filtros, { zonaId }),
    contarPublicaciones(filtros),
  ]);

  const nombreRubro = rubros.find((r) => r.id === rubroId)?.nombre;

  return (
    <main className="contenedor flex flex-1 flex-col gap-5">
      <Bienvenida />

      <Link href="/publicar" className="boton-principal">
        Publicar lo que ofrecés o necesitás
      </Link>

      <Filtros estado={filtros} rubros={rubros} />

      {ELEGIR_BARRIO && !persona?.zonaId && <SelectorZona zonas={zonas} zonaElegida={zonaVisitante} />}

      <div className="flex items-baseline justify-between gap-3">
        <h1 className="etiqueta">{tipo === "necesito" ? "Lo que necesitan" : "Lo que ofrecen"}</h1>
        <p className="text-sm text-texto-2">
          {total === 1 ? "1 publicación" : `${total} publicaciones`}
        </p>
      </div>

      {publicaciones.length > 0 ? (
        <ListaPublicaciones inicial={publicaciones} filtros={filtros} />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="aviso">
            {nombreRubro
              ? `Todavía no hay publicaciones de ${nombreRubro}.`
              : "Todavía no hay publicaciones acá."}{" "}
            Podés ser la primera persona en publicar.
          </p>
          <Link href="/publicar" className="boton-principal">
            Publicar
          </Link>
        </div>
      )}

      <footer className="mt-2 flex flex-col gap-4">
        <AvisoConfianza />
        <Cita
          numero={149}
          texto="El trabajo no es un simple instrumento, sino que expresa y acrecienta la dignidad de nuestra vida."
        />
      </footer>
    </main>
  );
}
