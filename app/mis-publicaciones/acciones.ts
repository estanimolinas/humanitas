"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actualizarPersona,
  cerrarPublicacion,
  editarPublicacion,
  reactivarPublicacion,
} from "@/lib/mis-publicaciones";
import { esUuid } from "@/lib/ids";
import { invalidarSesion } from "@/lib/personas";
import { personaActual } from "@/lib/sesion/actual";
import { borrarSesion } from "@/lib/sesion/guardar";
import { normalizarTelefono } from "@/lib/telefono";

const texto = (formData: FormData, clave: string) => {
  const v = formData.get(clave);
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
};
const textoONulo = (formData: FormData, clave: string) => texto(formData, clave) || null;
/** Un id numérico válido o null: nada que no sea un entero positivo llega a la base. */
const idONulo = (formData: FormData, clave: string) => {
  const n = Number(texto(formData, clave));
  return Number.isInteger(n) && n > 0 ? n : null;
};

async function persona() {
  const p = await personaActual();
  if (!p) redirect("/alta?volver=%2Fmis-publicaciones");
  return p;
}

/** El id de la publicación del formulario, o de vuelta a Mis publicaciones si no es válido. */
function publicacionDe(formData: FormData): string {
  const id = texto(formData, "publicacionId");
  if (!esUuid(id)) redirect("/mis-publicaciones");
  return id;
}

/** Cerrar (7.4). En un necesito, "Sí, con alguien de acá" suma el concretado (8.4, D2). */
export async function cerrar(formData: FormData) {
  const p = await persona();
  const id = publicacionDe(formData);
  const motivo = texto(formData, "motivo");
  const quienHizoCrudo = textoONulo(formData, "personaQueHizoId");
  const quienHizo = esUuid(quienHizoCrudo) ? quienHizoCrudo : null;

  if (motivo === "resuelta_con_alguien_de_aca" && !quienHizo) {
    redirect(`/mis-publicaciones/${id}/cerrar?falta=1`);
  }

  const r = await cerrarPublicacion(id, p.id, motivo, quienHizo);
  // Solo viaja el código: la pantalla muestra sus propios textos, nunca uno que venga en la URL.
  if (!r.ok) redirect(`/mis-publicaciones?error=${r.motivo}`);
  revalidatePath("/mis-publicaciones");
  redirect("/mis-publicaciones?listo=cerrada");
}

export async function reactivar(formData: FormData) {
  const p = await persona();
  const r = await reactivarPublicacion(publicacionDe(formData), p.id);
  if (!r.ok) redirect(`/mis-publicaciones?error=${r.motivo}`);
  revalidatePath("/mis-publicaciones");
  redirect("/mis-publicaciones?listo=reactivada");
}

export async function editar(formData: FormData) {
  const p = await persona();
  const id = publicacionDe(formData);
  const titulo = texto(formData, "titulo");
  if (titulo.length === 0 || titulo.length > 60) {
    redirect(`/mis-publicaciones/${id}/editar?error=titulo`);
  }
  const zonaId = idONulo(formData, "zonaId");

  const ok = await editarPublicacion(id, p.id, {
    titulo,
    descripcion: textoONulo(formData, "descripcion"),
    precioTexto: textoONulo(formData, "precioTexto"),
    aliasPago: textoONulo(formData, "aliasPago"),
    zonaId,
    zonaOtroTexto: zonaId ? null : textoONulo(formData, "zonaOtroTexto"),
  });
  if (!ok) redirect("/mis-publicaciones?error=no_se_pudo_editar");
  revalidatePath("/mis-publicaciones");
  redirect("/mis-publicaciones?listo=editada");
}

/** Datos de la persona (7.4): el teléfono se cambia con confirmación en pantalla. */
export async function guardarDatos(formData: FormData) {
  const p = await persona();
  const nombre = texto(formData, "nombre");
  if (nombre.length === 0) redirect("/mis-publicaciones/datos?error=nombre");

  // Vacío = no cambia el celular (así lo dice la pantalla).
  const telefonoCrudo = texto(formData, "telefono");
  const telefono = telefonoCrudo ? normalizarTelefono(telefonoCrudo) : null;
  if (telefono && !telefono.ok) redirect("/mis-publicaciones/datos?error=telefono");

  const r = await actualizarPersona(p.id, {
    nombre,
    telefono: telefono?.ok ? telefono.normalizado : null,
    zonaId: idONulo(formData, "zonaId"),
  });
  if (!r.ok) redirect("/mis-publicaciones/datos?error=telefono_existente");
  revalidatePath("/mis-publicaciones");
  redirect("/mis-publicaciones?listo=datos");
}

/** Cerrar sesión (11.5): invalida el token en la base y borra la cookie de este celular. */
export async function cerrarSesion() {
  const p = await personaActual();
  if (p) await invalidarSesion(p.id);
  await borrarSesion();
  // El service worker ve este parámetro y borra lo guardado para mirar sin conexión.
  redirect("/?sesion=cerrada");
}
