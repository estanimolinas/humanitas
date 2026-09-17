"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolverRevision, type AccionOperador } from "@/lib/operador";
import { personaActual } from "@/lib/sesion/actual";

/** Resolver una denuncia (R09). Solo el operador; queda registrado en acciones_operador (P2). */
export async function resolver(formData: FormData) {
  const persona = await personaActual();
  if (!persona?.esOperador) redirect("/");

  const publicacionId = String(formData.get("publicacionId") ?? "");
  const accion = String(formData.get("accion") ?? "") as AccionOperador;
  const resolucion = String(formData.get("resolucion") ?? "").trim() || "Sin comentario";

  const r = await resolverRevision(publicacionId, persona.id, accion, resolucion);
  revalidatePath("/operador");
  redirect(r.ok ? "/operador?listo=1" : `/operador?error=${encodeURIComponent(r.motivo)}`);
}
