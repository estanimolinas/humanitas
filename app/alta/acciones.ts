"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { camposDesdeFormData, validarAlta, volverSeguro, type ErroresAlta } from "@/lib/alta";
import { registrarPersona } from "@/lib/personas";
import { personaActual } from "@/lib/sesion/actual";
import { COOKIE_SESION } from "@/lib/sesion/constantes";
import { opcionesCookieSesion } from "@/lib/sesion/token";

export type EstadoAlta = { errores?: ErroresAlta; mensaje?: string };

export async function darDeAlta(_previo: EstadoAlta, formData: FormData): Promise<EstadoAlta> {
  const volver = volverSeguro(formData.get("volver"));

  // Si ya tiene sesión, no se crea otra cuenta.
  if (await personaActual()) redirect(volver);

  const validacion = validarAlta(camposDesdeFormData(formData));
  if (!validacion.ok) return { errores: validacion.errores };

  const resultado = await registrarPersona(validacion.datos);
  if (!resultado.ok) {
    // 7.5 / F1: el teléfono ya existe → cómo recuperar el acceso (manual en el piloto, 10.4).
    return {
      errores: { telefono: "Ese número ya tiene una cuenta." },
      mensaje:
        "Si cambiaste de celular, pedí que te recuperen el acceso en tu punto de alta: la vecinal, la parroquia o el centro comunitario donde te anotaste.",
    };
  }

  (await cookies()).set(COOKIE_SESION, resultado.token, opcionesCookieSesion());
  redirect(volver);
}
