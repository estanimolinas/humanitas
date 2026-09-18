import "server-only";
import { cookies } from "next/headers";
import { COOKIE_SESION, COOKIE_SESION_DESDE } from "@/lib/sesion/constantes";
import { opcionesCookieSesion } from "@/lib/sesion/token";

/** Deja la sesión en este celular: el token y la fecha en que se emitió. */
export async function guardarSesion(token: string): Promise<void> {
  const galletas = await cookies();
  galletas.set(COOKIE_SESION, token, opcionesCookieSesion());
  galletas.set(COOKIE_SESION_DESDE, String(Date.now()), opcionesCookieSesion());
}

export async function borrarSesion(): Promise<void> {
  const galletas = await cookies();
  galletas.delete(COOKIE_SESION);
  galletas.delete(COOKIE_SESION_DESDE);
}
