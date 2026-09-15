import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { buscarPersonaPorToken, type PersonaSesion } from "@/lib/personas";
import { COOKIE_SESION } from "@/lib/sesion/constantes";

/** La persona identificada por la cookie, o null si mira sin cuenta. Una consulta por request. */
export const personaActual = cache(async (): Promise<PersonaSesion | null> => {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return null;
  return buscarPersonaPorToken(token);
});
