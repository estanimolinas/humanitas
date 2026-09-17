import "server-only";
import { supabaseServidor } from "@/lib/supabase/servidor";

export type Referente = { id: string; lugar: string };

/** El lugar donde da de alta este referente, o null si la persona no es referente activo. */
export async function referenteDe(personaId: string): Promise<Referente | null> {
  const { data, error } = await supabaseServidor()
    .from("referentes")
    .select("id, lugar")
    .eq("persona_id", personaId)
    .eq("activo", true)
    .is("archivado_en", null)
    .limit(1)
    .maybeSingle<Referente>();
  if (error) throw error;
  return data;
}

export type PersonaParaVerificar = {
  id: string;
  nombre: string;
  verificadoLugar: string | null;
};

/**
 * Busca a la persona que el referente tiene adelante, por el teléfono que ella misma dicta.
 * Devuelve solo el nombre: el referente no ve más datos que los que la persona ya cargó (10.3).
 */
export async function buscarPorTelefono(telefono: string): Promise<PersonaParaVerificar | null> {
  const { data, error } = await supabaseServidor()
    .from("personas")
    .select("id, nombre, verificado_lugar")
    .eq("telefono", telefono)
    .is("archivado_en", null)
    .maybeSingle<{ id: string; nombre: string; verificado_lugar: string | null }>();
  if (error) throw error;
  return data ? { id: data.id, nombre: data.nombre, verificadoLugar: data.verificado_lugar } : null;
}

export async function verificarPersona(
  personaId: string,
  referentePersonaId: string,
): Promise<{ ok: true; lugar: string } | { ok: false; motivo: string }> {
  const { data, error } = await supabaseServidor().rpc("verificar_persona", {
    p_persona_id: personaId,
    p_referente_persona_id: referentePersonaId,
  });
  if (error) throw error;
  const fila = (data as { ok: boolean; motivo_rechazo: string | null; lugar: string | null }[])[0];
  return fila?.ok
    ? { ok: true, lugar: fila.lugar ?? "" }
    : { ok: false, motivo: fila?.motivo_rechazo ?? "desconocido" };
}
