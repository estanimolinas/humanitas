import "server-only";
import { DIAS_ROTACION_TOKEN } from "@/lib/sesion/constantes";
import { generarToken, hashToken } from "@/lib/sesion/token";
import { supabaseServidor } from "@/lib/supabase/servidor";

export type ResultadoRotacion =
  | { valido: false }
  | { valido: true; tokenNuevo: string | null; emitidoEn: number };

/**
 * Renueva el token si tiene más de DIAS_ROTACION_TOKEN días (11.5). La base decide con su propia
 * fecha, así que falsear la cookie de fecha no sirve para nada.
 */
export async function rotarSiHaceFalta(token: string): Promise<ResultadoRotacion> {
  const nuevo = generarToken();
  const { data, error } = await supabaseServidor().rpc("rotar_token", {
    p_hash_actual: hashToken(token),
    p_hash_nuevo: hashToken(nuevo),
    p_dias: DIAS_ROTACION_TOKEN,
  });
  if (error) throw error;
  const fila = (data as { rotado: boolean; emitido_en: string | null }[] | null)?.[0];
  if (!fila?.emitido_en) return { valido: false };
  return {
    valido: true,
    tokenNuevo: fila.rotado ? nuevo : null,
    emitidoEn: new Date(fila.emitido_en).getTime(),
  };
}
