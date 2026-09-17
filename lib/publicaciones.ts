import "server-only";
import {
  POR_PAGINA,
  type FiltrosListado,
  type PublicacionListada,
} from "@/lib/publicaciones-tipos";
import { supabaseServidor } from "@/lib/supabase/servidor";

export type { FiltrosListado, PublicacionListada, Subtipo, Tipo } from "@/lib/publicaciones-tipos";
export { POR_PAGINA } from "@/lib/publicaciones-tipos";

/**
 * Listado de 7.1 con el orden de 8.2. La zona de quien mira solo ordena (8.1).
 * `excluir` son las publicaciones ya mostradas en esta pantalla, para que "Ver más" no repita.
 */
export async function listarPublicaciones(
  filtros: FiltrosListado,
  opciones: { zonaId?: number | null; excluir?: string[]; limite?: number } = {},
): Promise<PublicacionListada[]> {
  const { data, error } = await supabaseServidor().rpc("listar_publicaciones", {
    p_tipo: filtros.tipo,
    p_subtipo: filtros.subtipo ?? null,
    p_rubro_id: filtros.rubroId ?? null,
    p_zona_id: opciones.zonaId ?? null,
    p_limite: opciones.limite ?? POR_PAGINA,
    p_excluir: opciones.excluir ?? [],
  });
  if (error) throw error;
  return (data ?? []) as PublicacionListada[];
}

/** Cuántas publicaciones activas hay con estos filtros. La zona no entra (8.1). */
export async function contarPublicaciones(filtros: FiltrosListado): Promise<number> {
  let consulta = supabaseServidor()
    .from("publicaciones")
    .select("id", { count: "exact", head: true })
    .eq("estado", "activa")
    .is("archivado_en", null)
    .eq("tipo", filtros.tipo);
  if (filtros.subtipo) consulta = consulta.eq("subtipo", filtros.subtipo);
  if (filtros.rubroId) consulta = consulta.eq("rubro_id", filtros.rubroId);
  const { count, error } = await consulta;
  if (error) throw error;
  return count ?? 0;
}
