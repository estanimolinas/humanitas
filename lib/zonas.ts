import "server-only";
import { supabaseServidor } from "@/lib/supabase/servidor";

export type GrupoZonas = { localidad: string; barrios: { id: number; nombre: string }[] };

type FilaZona = { id: number; nombre: string; tipo: string; parent_id: number | null };

/** Barrios agrupados por localidad, para un selector simple. */
export async function zonasParaElegir(): Promise<GrupoZonas[]> {
  const { data, error } = await supabaseServidor()
    .from("zonas")
    .select("id, nombre, tipo, parent_id")
    .is("archivado_en", null)
    .in("tipo", ["localidad", "barrio"])
    .order("nombre")
    .returns<FilaZona[]>();
  if (error) throw error;

  return data
    .filter((z) => z.tipo === "localidad")
    .map((localidad) => ({
      localidad: localidad.nombre,
      barrios: data
        .filter((z) => z.tipo === "barrio" && z.parent_id === localidad.id)
        .map(({ id, nombre }) => ({ id, nombre })),
    }))
    .filter((g) => g.barrios.length > 0);
}
