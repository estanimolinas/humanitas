import "server-only";
import { supabaseServidor } from "@/lib/supabase/servidor";
import type { Subtipo, Tipo } from "@/lib/publicaciones-tipos";

/** Detalle de una publicación (7.2). Nunca incluye el teléfono (R05). */
export type PublicacionDetalle = {
  id: string;
  tipo: Tipo;
  subtipo: Subtipo | null;
  titulo: string;
  descripcion: string | null;
  precioTexto: string | null;
  aliasPago: string | null;
  fotoUrl: string | null;
  creadaEn: string;
  rubro: string;
  rubroOtroTexto: string | null;
  zona: string | null;
  personaNombre: string;
  verificadoLugar: string | null;
  concretados: number;
  contactosMes: number;
};

type Fila = {
  id: string;
  tipo: Tipo;
  subtipo: Subtipo | null;
  titulo: string;
  descripcion: string | null;
  precio_texto: string | null;
  alias_pago: string | null;
  foto_url: string | null;
  creada_en: string;
  rubro_otro_texto: string | null;
  zona_otro_texto: string | null;
  persona_id: string;
  rubros: { nombre: string } | null;
  zonas: { nombre: string } | null;
  personas: { nombre: string; verificado_lugar: string | null } | null;
};

/** Devuelve null si no existe o no está activa (una en revisión queda oculta, 8.5). */
export async function obtenerDetalle(id: string): Promise<PublicacionDetalle | null> {
  const supabase = supabaseServidor();

  const { data, error } = await supabase
    .from("publicaciones")
    .select(
      `id, tipo, subtipo, titulo, descripcion, precio_texto, alias_pago, foto_url, creada_en,
       rubro_otro_texto, zona_otro_texto, persona_id,
       rubros ( nombre ), zonas ( nombre ), personas ( nombre, verificado_lugar )`,
    )
    .eq("id", id)
    .eq("estado", "activa")
    .is("archivado_en", null)
    .maybeSingle<Fila>();

  if (error) throw error;
  if (!data || !data.personas || !data.rubros) return null;

  const [{ count: concretados }, { count: contactosMes }] = await Promise.all([
    supabase
      .from("concretados")
      .select("id", { count: "exact", head: true })
      .eq("persona_que_hizo_id", data.persona_id),
    supabase
      .from("contactos")
      .select("id", { count: "exact", head: true })
      .eq("publicacion_id", data.id)
      .is("archivado_en", null)
      .gte("creada_en", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  return {
    id: data.id,
    tipo: data.tipo,
    subtipo: data.subtipo,
    titulo: data.titulo,
    descripcion: data.descripcion,
    precioTexto: data.precio_texto,
    aliasPago: data.alias_pago,
    fotoUrl: data.foto_url,
    creadaEn: data.creada_en,
    rubro: data.rubros.nombre,
    rubroOtroTexto: data.rubro_otro_texto,
    zona: data.zonas?.nombre ?? data.zona_otro_texto,
    personaNombre: data.personas.nombre,
    verificadoLugar: data.personas.verificado_lugar,
    concretados: concretados ?? 0,
    contactosMes: contactosMes ?? 0,
  };
}
