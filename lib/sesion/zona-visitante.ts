import "server-only";
import { cookies } from "next/headers";

/**
 * Zona elegida por quien mira sin cuenta. Solo ordena, nunca filtra (8.1).
 * Es una cookie sin ningún identificador de persona: no sirve para seguir a nadie (sección 16).
 */
export const COOKIE_ZONA = "humanitas_zona";

export async function zonaDelVisitante(): Promise<number | null> {
  const valor = (await cookies()).get(COOKIE_ZONA)?.value;
  if (!valor) return null;
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}
