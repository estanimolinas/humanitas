/** Armado del link de WhatsApp. Puro, para poder testearlo. */

import { normalizarTelefono } from "@/lib/telefono";

export const LIMITE_CONTACTOS_POR_DIA = 15; // 8.5

/** El texto que se manda al contactar. Se muestra antes de tocar el botón, tal cual. */
export function mensajeContacto(opciones: {
  titulo: string;
  nombreDestinatario: string;
  nombreRemitente: string;
}): string {
  return (
    `Hola ${opciones.nombreDestinatario}, te escribo por Humanitas por tu publicación ` +
    `«${opciones.titulo}». Soy ${opciones.nombreRemitente}.`
  );
}

/**
 * Mensaje prearmado que cita la publicación (R04).
 * `telefono` ya viene normalizado (549…) y solo se usa en el servidor.
 */
export function linkContacto(opciones: {
  telefono: string;
  titulo: string;
  nombreDestinatario: string;
  nombreRemitente: string;
}): string {
  return `https://wa.me/${opciones.telefono}?text=${encodeURIComponent(mensajeContacto(opciones))}`;
}

/**
 * Link al WhatsApp del equipo (pantalla de Ayuda). Recibe el número tal como está en
 * WHATSAPP_EQUIPO; si falta o no es válido, devuelve null y la pantalla lo dice.
 */
export function linkEquipo(numero: string | undefined): string | null {
  if (!numero) return null;
  const r = normalizarTelefono(numero);
  if (!r.ok) return null;
  const texto = "Hola, les escribo desde Humanitas porque necesito ayuda.";
  return `https://wa.me/${r.normalizado}?text=${encodeURIComponent(texto)}`;
}
