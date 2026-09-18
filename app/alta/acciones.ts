"use server";

import { redirect } from "next/navigation";
import { camposDesdeFormData, validarAlta, volverSeguro, type ErroresAlta } from "@/lib/alta";
import { permitirIntento } from "@/lib/limites";
import { registrarPersona } from "@/lib/personas";
import { personaActual } from "@/lib/sesion/actual";
import { guardarSesion } from "@/lib/sesion/guardar";

export type EstadoAlta = { errores?: ErroresAlta; mensaje?: string };

export async function darDeAlta(_previo: EstadoAlta, formData: FormData): Promise<EstadoAlta> {
  const volver = volverSeguro(formData.get("volver"));

  // Si ya tiene sesión, no se crea otra cuenta.
  if (await personaActual()) redirect(volver);

  const validacion = validarAlta(camposDesdeFormData(formData));
  if (!validacion.ok) return { errores: validacion.errores };

  // 11.5: tope de cuentas nuevas por conexión, contra robots.
  if (!(await permitirIntento("alta"))) {
    return { mensaje: "Hoy se crearon muchas cuentas desde esta conexión. Mañana vas a poder crear la tuya." };
  }

  const resultado = await registrarPersona(validacion.datos);
  if (!resultado.ok) {
    // 7.5 / F1: el teléfono ya existe → cómo recuperar el acceso (manual en el piloto, 10.4).
    return {
      errores: { telefono: "Ese número ya tiene una cuenta." },
      mensaje:
        "Si cambiaste de celular, el equipo de Humanitas te ayuda a recuperar tu cuenta. Lo encontrás en Ayuda, desde Mis publicaciones.",
    };
  }

  await guardarSesion(resultado.token);
  redirect(volver);
}
