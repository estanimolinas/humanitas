import "server-only";
import { supabaseServidor } from "@/lib/supabase/servidor";

export type Rubro = { id: number; nombre: string; familia: "servicio" | "producto" };

/** Rubros activos para los chips del listado (sección 6). */
export async function rubrosActivos(): Promise<Rubro[]> {
  const { data, error } = await supabaseServidor()
    .from("rubros")
    .select("id, nombre, familia")
    .eq("activo", true)
    .is("archivado_en", null)
    // Servicios primero (son los oficios), después productos. Dentro de cada familia, el orden
    // de la sección 6.
    .order("familia", { ascending: false })
    .order("orden")
    .returns<Rubro[]>();
  if (error) throw error;
  return data ?? [];
}
