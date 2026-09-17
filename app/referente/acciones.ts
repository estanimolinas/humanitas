"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { referenteDe, verificarPersona } from "@/lib/referente";
import { personaActual } from "@/lib/sesion/actual";
import { normalizarTelefono } from "@/lib/telefono";

async function referenteLogueado() {
  const persona = await personaActual();
  if (!persona) redirect("/alta?volver=%2Freferente");
  const referente = await referenteDe(persona.id);
  if (!referente) redirect("/");
  return persona;
}

/** Buscar a la persona que está adelante, por el teléfono que ella dicta (R14, E2). */
export async function buscar(formData: FormData) {
  await referenteLogueado();
  const telefono = normalizarTelefono(String(formData.get("telefono") ?? ""));
  if (!telefono.ok) redirect(`/referente?error=${encodeURIComponent(telefono.error)}`);
  redirect(`/referente?telefono=${telefono.normalizado}`);
}

export async function verificar(formData: FormData) {
  const persona = await referenteLogueado();
  const personaId = String(formData.get("personaId") ?? "");
  const r = await verificarPersona(personaId, persona.id);
  revalidatePath("/referente");
  redirect(r.ok ? `/referente?listo=${encodeURIComponent(r.lugar)}` : `/referente?error=${r.motivo}`);
}
