import "server-only";
import { supabaseServidor } from "@/lib/supabase/servidor";

export type DenunciaEnCola = {
  id: string;
  motivo: string;
  detalle: string | null;
  creadaEn: string;
  anonima: boolean;
};

export type PublicacionEnRevision = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  estado: string;
  personaNombre: string;
  denuncias: DenunciaEnCola[];
  posibleMenor: boolean;
};

type FilaDenuncia = {
  id: string;
  motivo: string;
  detalle: string | null;
  creada_en: string;
  persona_id: string | null;
  publicaciones: {
    id: string;
    titulo: string;
    descripcion: string | null;
    tipo: string;
    estado: string;
    personas: { nombre: string } | null;
  } | null;
};

/**
 * Cola del operador (R09, R24 mínimo): publicaciones con denuncias sin resolver.
 * "Posible menor" va primero (R16).
 */
export async function colaDelOperador(): Promise<PublicacionEnRevision[]> {
  const { data, error } = await supabaseServidor()
    .from("denuncias")
    .select(
      `id, motivo, detalle, creada_en, persona_id,
       publicaciones ( id, titulo, descripcion, tipo, estado, personas ( nombre ) )`,
    )
    .is("resuelta_en", null)
    .is("archivado_en", null)
    .order("creada_en", { ascending: true })
    .returns<FilaDenuncia[]>();
  if (error) throw error;

  const porPublicacion = new Map<string, PublicacionEnRevision>();
  for (const d of data ?? []) {
    const pub = d.publicaciones;
    if (!pub) continue;
    const actual = porPublicacion.get(pub.id) ?? {
      id: pub.id,
      titulo: pub.titulo,
      descripcion: pub.descripcion,
      tipo: pub.tipo,
      estado: pub.estado,
      personaNombre: pub.personas?.nombre ?? "",
      denuncias: [],
      posibleMenor: false,
    };
    actual.denuncias.push({
      id: d.id,
      motivo: d.motivo,
      detalle: d.detalle,
      creadaEn: d.creada_en,
      anonima: d.persona_id === null,
    });
    if (d.motivo === "posible_menor") actual.posibleMenor = true;
    porPublicacion.set(pub.id, actual);
  }

  return [...porPublicacion.values()].sort((a, b) => {
    if (a.posibleMenor !== b.posibleMenor) return a.posibleMenor ? -1 : 1;
    return b.denuncias.length - a.denuncias.length;
  });
}

export type AccionOperador = "archivar" | "reactivar";

export async function resolverRevision(
  publicacionId: string,
  operadorId: string,
  accion: AccionOperador,
  resolucion: string,
): Promise<{ ok: true } | { ok: false; motivo: string }> {
  const { data, error } = await supabaseServidor().rpc("resolver_revision", {
    p_publicacion_id: publicacionId,
    p_operador_id: operadorId,
    p_accion: accion,
    p_resolucion: resolucion,
  });
  if (error) throw error;
  const fila = (data as { ok: boolean; motivo_rechazo: string | null }[])[0];
  return fila?.ok ? { ok: true } : { ok: false, motivo: fila?.motivo_rechazo ?? "desconocido" };
}

export type AccionRegistrada = {
  id: string;
  accion: string;
  objetivoTipo: string;
  objetivoId: string;
  creadaEn: string;
  operador: string;
};

/** Registro público de las intervenciones administrativas (P2, E4). */
export async function ultimasAcciones(limite = 20): Promise<AccionRegistrada[]> {
  const { data, error } = await supabaseServidor()
    .from("acciones_operador")
    .select("id, accion, objetivo_tipo, objetivo_id, creada_en, personas ( nombre )")
    .order("creada_en", { ascending: false })
    .limit(limite)
    .returns<
      {
        id: string;
        accion: string;
        objetivo_tipo: string;
        objetivo_id: string;
        creada_en: string;
        personas: { nombre: string } | null;
      }[]
    >();
  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id,
    accion: a.accion,
    objetivoTipo: a.objetivo_tipo,
    objetivoId: a.objetivo_id,
    creadaEn: a.creada_en,
    operador: a.personas?.nombre ?? "",
  }));
}
