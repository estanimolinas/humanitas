"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { listarPublicaciones } from "@/lib/publicaciones";
import type { FiltrosListado, PublicacionListada } from "@/lib/publicaciones-tipos";
import { personaActual } from "@/lib/sesion/actual";
import { COOKIE_BIENVENIDA } from "@/lib/sesion/constantes";
import { COOKIE_ZONA } from "@/lib/sesion/zona-visitante";
import { zonaDelVisitante } from "@/lib/sesion/zona-visitante";

/** "Ver más" (7.1): trae la página siguiente sin repetir lo ya mostrado. */
export async function traerMas(
  filtros: FiltrosListado,
  yaMostradas: string[],
): Promise<PublicacionListada[]> {
  const persona = await personaActual();
  const zonaId = persona?.zonaId ?? (await zonaDelVisitante());
  return listarPublicaciones(filtros, { zonaId, excluir: yaMostradas });
}

/** Guarda la zona de quien mira sin cuenta. Solo ordena (8.1). */
export async function elegirZona(formData: FormData) {
  const valor = formData.get("zonaId");
  const galletas = await cookies();
  const id = typeof valor === "string" ? Number(valor) : NaN;

  if (!Number.isInteger(id) || id <= 0) {
    galletas.delete(COOKIE_ZONA);
  } else {
    galletas.set(COOKIE_ZONA, String(id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 400 * 24 * 60 * 60,
    });
  }
  revalidatePath("/");
}

/** Cerrar la bienvenida: una cookie sin identificador que solo dice "ya la vio". */
export async function cerrarBienvenida() {
  (await cookies()).set(COOKIE_BIENVENIDA, "vista", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 400 * 24 * 60 * 60,
  });
  revalidatePath("/");
}
