// Sin "server-only": lo importa también proxy.ts.
export const COOKIE_SESION = "humanitas_sesion";

/**
 * Cuándo se emitió el token (milisegundos). No es secreta: solo evita ir a la base en cada
 * visita para saber si toca renovar el token. La base igual controla la fecha real.
 */
export const COOKIE_SESION_DESDE = "humanitas_sesion_desde";

/** Cada cuántos días se renueva solo el token de sesión (11.5, decisión 18/09/2026). */
export const DIAS_ROTACION_TOKEN = 30;
