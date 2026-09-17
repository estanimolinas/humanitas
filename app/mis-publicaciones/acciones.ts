"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actualizarPersona,
  cerrarPublicacion,
  editarPublicacion,
  reactivarPublicacion,
} from "@/lib/mis-publicaciones";
import { personaActual } from "@/lib/sesion/actual";
import { normalizarTelefono } from "@/lib/telefono";

const texto = (formData: FormData, clave: string) => {
  const v = formData.get(clave);
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
};
const textoONulo = (formData: FormData, clave: string) => texto(formData, clave) || null;

async function persona() {
  const p = await personaActual();
  if (!p) redirect("/alta?volver=%2Fmis-publicaciones");
  return p;
}

const MENSAJES: Record<string, string> = {
  no_es_tuya: "Esa publicación no es tuya.",
  no_esta_activa: "Esa publicación ya estaba cerrada.",
  no_esta_cerrada: "Esa publicación ya está activa.",
  no_te_contacto: "Esa persona no pidió tu contacto por esta publicación.",
  motivo_invalido: "Elegí una de las opciones.",
  limite_activas: "Tenés 20 publicaciones activas. Cerrá alguna antes de reactivar esta.",
};

/** Cerrar (7.4). En un necesito, "Sí, con alguien de acá" suma el concretado (8.4, D2). */
export async function cerrar(formData: FormData) {
  const p = await persona();
  const id = texto(formData, "publicacionId");
  const motivo = texto(formData, "motivo");
  const quienHizo = textoONulo(formData, "personaQueHizoId");

  if (motivo === "resuelta_con_alguien_de_aca" && !quienHizo) {
    redirect(`/mis-publicaciones/${id}/cerrar?falta=1`);
  }

  const r = await cerrarPublicacion(id, p.id, motivo, quienHizo);
  if (!r.ok) redirect(`/mis-publicaciones?error=${encodeURIComponent(MENSAJES[r.motivo] ?? r.motivo)}`);
  revalidatePath("/mis-publicaciones");
  redirect("/mis-publicaciones?listo=cerrada");
}

export async function reactivar(formData: FormData) {
  const p = await persona();
  const r = await reactivarPublicacion(texto(formData, "publicacionId"), p.id);
  if (!r.ok) redirect(`/mis-publicaciones?error=${encodeURIComponent(MENSAJES[r.motivo] ?? r.motivo)}`);
  revalidatePath("/mis-publicaciones");
  redirect("/mis-publicaciones?listo=reactivada");
}

export async function editar(formData: FormData) {
  const p = await persona();
  const id = texto(formData, "publicacionId");
  const titulo = texto(formData, "titulo");
  if (titulo.length === 0 || titulo.length > 60) {
    redirect(`/mis-publicaciones/${id}/editar?error=titulo`);
  }
  const zonaCruda = texto(formData, "zonaId");
  const zonaId = zonaCruda ? Number(zonaCruda) : null;

  const ok = await editarPublicacion(id, p.id, {
    titulo,
    descripcion: textoONulo(formData, "descripcion"),
    precioTexto: textoONulo(formData, "precioTexto"),
    aliasPago: textoONulo(formData, "aliasPago"),
    zonaId,
    zonaOtroTexto: zonaId ? null : textoONulo(formData, "zonaOtroTexto"),
  });
  if (!ok) redirect("/mis-publicaciones?error=No%20se%20pudo%20editar.");
  revalidatePath("/mis-publicaciones");
  redirect("/mis-publicaciones?listo=editada");
}

/** Datos de la persona (7.4): el teléfono se cambia con confirmación en pantalla. */
export async function guardarDatos(formData: FormData) {
  const p = await persona();
  const nombre = texto(formData, "nombre");
  const telefono = normalizarTelefono(texto(formData, "telefono"));
  if (nombre.length === 0) redirect("/mis-publicaciones/datos?error=nombre");
  if (!telefono.ok) redirect("/mis-publicaciones/datos?error=telefono");

  const zonaCruda = texto(formData, "zonaId");
  const r = await actualizarPersona(p.id, {
    nombre,
    telefono: telefono.normalizado,
    zonaId: zonaCruda ? Number(zonaCruda) : null,
  });
  if (!r.ok) redirect("/mis-publicaciones/datos?error=telefono_existente");
  revalidatePath("/mis-publicaciones");
  redirect("/mis-publicaciones?listo=datos");
}
