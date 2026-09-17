/** Armado del link de WhatsApp. Puro, para poder testearlo. */

export const LIMITE_CONTACTOS_POR_DIA = 15; // 8.5

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
  const texto =
    `Hola ${opciones.nombreDestinatario}, te escribo por Humanitas por tu publicación ` +
    `«${opciones.titulo}». Soy ${opciones.nombreRemitente}.`;
  return `https://wa.me/${opciones.telefono}?text=${encodeURIComponent(texto)}`;
}
