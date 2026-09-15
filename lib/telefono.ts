// Normalización de celulares argentinos para wa.me. Se usa en el cliente (para mostrarle a la
// persona su número antes de guardar) y en el servidor (que siempre vuelve a validar).
// Decisión 15/09/2026: NO se asume característica. Si falta, se le pide.

export const EJEMPLO_TELEFONO = "342 512 3456";

export type ResultadoTelefono =
  | { ok: true; normalizado: string; legible: string }
  | { ok: false; error: string };

const error = (mensaje: string): ResultadoTelefono => ({ ok: false, error: mensaje });

/**
 * Acepta las formas habituales ("342 15 512-3456", "0342 155123456", "+54 9 342 512 3456") y
 * devuelve `549` + característica + número (13 dígitos), que es lo que necesita wa.me.
 */
export function normalizarTelefono(entrada: string): ResultadoTelefono {
  let d = entrada.replace(/\D/g, "");
  if (d.length === 0) return error("Escribí tu número de celular.");

  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("54")) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1);
  }
  if (d.startsWith("0")) d = d.slice(1);

  // El "15" va después de la característica, que tiene de 2 a 4 dígitos.
  if (d.length === 12) {
    const posiciones = [2, 3, 4].filter((n) => d.slice(n, n + 2) === "15");
    if (posiciones.length !== 1) {
      return error(`Escribilo sin el 15, así: ${EJEMPLO_TELEFONO}`);
    }
    const n = posiciones[0];
    d = d.slice(0, n) + d.slice(n + 2);
  }

  if (d.length < 10) {
    return error(`Falta la característica. Escribilo así: ${EJEMPLO_TELEFONO}`);
  }
  // Las características argentinas empiezan con 1, 2 o 3.
  if (d.length !== 10 || !/^[123]/.test(d)) {
    return error(`Revisá el número. Tiene que ser la característica y el número, así: ${EJEMPLO_TELEFONO}`);
  }

  return { ok: true, normalizado: `549${d}`, legible: `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` };
}
