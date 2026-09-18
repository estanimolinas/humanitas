import "server-only";
import { headers } from "next/headers";
import { hashIp, ipDe, MAXIMOS_POR_DIA, type AccionLimitada } from "@/lib/seguridad/limites";
import { supabaseServidor } from "@/lib/supabase/servidor";

function sal(): string {
  const s = process.env.SAL_IP;
  if (s) return s;
  // Sin sal, una IP se podría recuperar probando todas: en producción es obligatoria.
  if (process.env.NODE_ENV === "production") throw new Error("Falta SAL_IP en el entorno.");
  return "solo-desarrollo";
}

/** ¿Esta conexión puede hacer la acción? Si puede, queda registrado el intento. */
export async function permitirIntento(accion: AccionLimitada): Promise<boolean> {
  const ipHash = await hashIp(ipDe(await headers()), sal());
  const { data, error } = await supabaseServidor().rpc("registrar_intento", {
    p_ip_hash: ipHash,
    p_accion: accion,
    p_maximo: MAXIMOS_POR_DIA[accion],
  });
  if (error) throw error;
  return data === true;
}
