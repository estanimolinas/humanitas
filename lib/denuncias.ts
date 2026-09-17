import "server-only";
import { supabaseServidor } from "@/lib/supabase/servidor";

export const MOTIVOS_DENUNCIA = [
  { valor: "estafa", texto: "Parece una estafa" },
  { valor: "contenido_inapropiado", texto: "El contenido es inapropiado" },
  { valor: "posible_menor", texto: "Parece que es un menor de edad" },
  { valor: "otro", texto: "Otro motivo" },
] as const;

export type MotivoDenuncia = (typeof MOTIVOS_DENUNCIA)[number]["valor"];

export function esMotivoValido(valor: string): valor is MotivoDenuncia {
  return MOTIVOS_DENUNCIA.some((m) => m.valor === valor);
}

export type ResultadoDenuncia =
  | { ok: true; quedoOculta: boolean }
  | { ok: false; motivo: string };

/** Denunciar una publicación (10.5). Con 2 denuncias de personas distintas se oculta (R09). */
export async function denunciar(
  publicacionId: string,
  personaId: string | null,
  motivo: MotivoDenuncia,
  detalle: string | null,
): Promise<ResultadoDenuncia> {
  const { data, error } = await supabaseServidor().rpc("registrar_denuncia", {
    p_publicacion_id: publicacionId,
    p_persona_id: personaId,
    p_motivo: motivo,
    p_detalle: detalle,
  });
  if (error) throw error;
  const fila = (data as { ok: boolean; motivo_rechazo: string | null; quedo_oculta: boolean }[])[0];
  return fila?.ok
    ? { ok: true, quedoOculta: fila.quedo_oculta }
    : { ok: false, motivo: fila?.motivo_rechazo ?? "desconocido" };
}
