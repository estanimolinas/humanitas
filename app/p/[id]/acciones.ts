"use server";

import { redirect } from "next/navigation";
import { esUuid } from "@/lib/ids";
import { permitirIntento } from "@/lib/limites";
import { contactar } from "@/lib/contactos";
import { denunciar, esMotivoValido } from "@/lib/denuncias";
import { personaActual } from "@/lib/sesion/actual";

/**
 * Contactar por WhatsApp (R04, C1).
 * - Sin cuenta: manda al alta mínima y vuelve al detalle listo para contactar.
 * - Con cuenta: registra el contacto y abre WhatsApp con el mensaje prearmado.
 * - Pasado el límite diario (8.5): vuelve al detalle con el aviso.
 */
export async function contactarPorWhatsApp(formData: FormData) {
  const id = String(formData.get("publicacionId") ?? "");
  if (!esUuid(id)) redirect("/");

  const persona = await personaActual();
  if (!persona) redirect(`/alta?volver=${encodeURIComponent(`/p/${id}?contactar=1`)}`);

  const resultado = await contactar(id, persona);
  if (!resultado.ok) redirect(`/p/${id}?${resultado.motivo === "propia" ? "propia" : "limite"}=1`);

  // El teléfono viaja solo acá, en el link de WhatsApp, nunca en una pantalla.
  redirect(resultado.link);
}

/** Denunciar (10.5, E3). Se puede sin cuenta; dos denuncias de personas distintas ocultan (R09). */
export async function denunciarPublicacion(formData: FormData) {
  const id = String(formData.get("publicacionId") ?? "");
  const motivo = String(formData.get("motivo") ?? "");
  if (!esUuid(id)) redirect("/");
  if (!esMotivoValido(motivo)) redirect(`/p/${id}/denunciar?error=motivo`);

  const detalle = String(formData.get("detalle") ?? "").trim() || null;
  const persona = await personaActual();

  // 11.5: sin cuenta, tope de denuncias por conexión (con cuenta ya hay una por persona).
  if (!persona && !(await permitirIntento("denuncia_anonima"))) {
    redirect(`/p/${id}/denunciar?error=limite`);
  }

  const r = await denunciar(id, persona?.id ?? null, motivo, detalle);
  if (!r.ok) redirect(`/p/${id}/denunciar?error=${r.motivo}`);
  redirect(`/p/${id}/denunciada`);
}
