import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** Token aleatorio largo (256 bits). En claro vive SOLO en la cookie httpOnly. */
export function generarToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Lo único que se guarda en la base (personas.token_hash). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// 400 días: el máximo que aceptan los navegadores para una cookie (R11: sesión persistente).
export const DURACION_SESION_SEGUNDOS = 400 * 24 * 60 * 60;

export function opcionesCookieSesion() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS,
  };
}
