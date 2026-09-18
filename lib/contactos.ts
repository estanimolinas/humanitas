import "server-only";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { linkContacto } from "@/lib/whatsapp";

type FilaContacto = {
  limite_alcanzado: boolean;
  telefono: string | null;
  titulo: string | null;
  nombre: string | null;
};

export type ResultadoContacto =
  | { ok: true; link: string }
  | { ok: false; motivo: "limite_diario" | "propia" };

/**
 * Registra el contacto (8.3) y devuelve el link de WhatsApp ya armado.
 * El teléfono nunca sale de esta función: solo viaja dentro del link (R05).
 */
export async function contactar(
  publicacionId: string,
  solicitante: { id: string; nombre: string },
): Promise<ResultadoContacto> {
  const { data, error } = await supabaseServidor().rpc("registrar_contacto", {
    p_publicacion_id: publicacionId,
    p_persona_id: solicitante.id,
  });
  if (error) throw error;

  const fila = (data as FilaContacto[])[0];
  if (!fila || fila.limite_alcanzado) return { ok: false, motivo: "limite_diario" };
  // La propia publicación: la base no registra nada ni devuelve teléfono.
  if (!fila.telefono) return { ok: false, motivo: "propia" };

  return {
    ok: true,
    link: linkContacto({
      telefono: fila.telefono,
      titulo: fila.titulo!,
      nombreDestinatario: fila.nombre!,
      nombreRemitente: solicitante.nombre,
    }),
  };
}
