/**
 * Límites por conexión (paso 11.5, punto 3). Puro, para poder testearlo.
 *
 * Los máximos son por día y por conexión. Son altos a propósito: en un encuentro todas las
 * personas pueden estar en el mismo Wi-Fi, y en los datos móviles muchas comparten la misma IP.
 * Alcanzan para frenar a un robot sin trabar a nadie.
 */
export const MAXIMOS_POR_DIA = {
  alta: 30,
  denuncia_anonima: 20,
} as const;

export type AccionLimitada = keyof typeof MAXIMOS_POR_DIA;

/** La IP de quien pide. En Vercel la ponen sus servidores (x-real-ip); el resto es respaldo. */
export function ipDe(cabeceras: { get(nombre: string): string | null }): string {
  return (
    cabeceras.get("x-real-ip")?.trim() ||
    cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "desconocida"
  );
}

/** SHA-256 de la IP con una sal secreta: en la base nunca queda la IP en claro. */
export async function hashIp(ip: string, sal: string): Promise<string> {
  const datos = new TextEncoder().encode(`${sal}:${ip}`);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
