"use server";

import { redirect } from "next/navigation";
import { contactar } from "@/lib/contactos";
import { personaActual } from "@/lib/sesion/actual";

/**
 * Contactar por WhatsApp (R04, C1).
 * - Sin cuenta: manda al alta mínima y vuelve al detalle listo para contactar.
 * - Con cuenta: registra el contacto y abre WhatsApp con el mensaje prearmado.
 * - Pasado el límite diario (8.5): vuelve al detalle con el aviso.
 */
export async function contactarPorWhatsApp(formData: FormData) {
  const id = String(formData.get("publicacionId") ?? "");
  if (!id) redirect("/");

  const persona = await personaActual();
  if (!persona) redirect(`/alta?volver=${encodeURIComponent(`/p/${id}?contactar=1`)}`);

  const resultado = await contactar(id, persona);
  if (!resultado.ok) redirect(`/p/${id}?limite=1`);

  // El teléfono viaja solo acá, en el link de WhatsApp, nunca en una pantalla.
  redirect(resultado.link);
}
