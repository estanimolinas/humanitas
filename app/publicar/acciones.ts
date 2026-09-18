"use server";

import { redirect } from "next/navigation";
import { camposDesdeFormData as camposAltaDesdeFormData, validarAlta } from "@/lib/alta";
import { permitirIntento } from "@/lib/limites";
import { registrarPersona } from "@/lib/personas";
import { crearPublicacion, subirFoto } from "@/lib/publicar";
import { personaActual } from "@/lib/sesion/actual";
import { guardarSesion } from "@/lib/sesion/guardar";
import {
  camposDesdeFormData,
  validarPublicacion,
  type ErroresPublicacion,
} from "@/lib/validar-publicacion";
import type { ErroresAlta } from "@/lib/alta";

export type EstadoPublicar = {
  errores?: ErroresPublicacion;
  erroresAlta?: ErroresAlta;
  mensaje?: string;
};

const MENSAJES = {
  limite_diario:
    "Por hoy ya hiciste 3 publicaciones, que es el tope diario. Mañana vas a poder seguir: así hay lugar para todas las personas.",
  limite_activas: "Ya tenés 20 publicaciones activas, que es el tope. Si cerrás alguna desde Mis publicaciones, podés sumar otra.",
  rubro_invalido: "Ese rubro ya no está disponible. Podés elegir otro de la lista.",
  rubro_no_corresponde: "Ese rubro no corresponde a lo que elegiste.",
} as const;

/**
 * Publicar (7.3, R02). Si la persona no tiene cuenta, el mismo envío trae los datos del alta
 * mínima (7.5) y nada de lo que escribió se pierde (B4).
 */
export async function publicar(_previo: EstadoPublicar, formData: FormData): Promise<EstadoPublicar> {
  const campos = camposDesdeFormData(formData);
  const rubroEsOtros = formData.get("rubroEsOtros") === "si";

  const validacion = validarPublicacion(campos, rubroEsOtros);
  if (!validacion.ok) return { errores: validacion.errores };

  let persona = await personaActual();

  // Sin cuenta: se crea acá, con los datos del alta que vienen en el mismo formulario.
  if (!persona) {
    const validacionAlta = validarAlta(camposAltaDesdeFormData(formData));
    if (!validacionAlta.ok) return { erroresAlta: validacionAlta.errores };

    // 11.5: tope de cuentas nuevas por conexión, contra robots.
    if (!(await permitirIntento("alta"))) {
      return { mensaje: "Hoy se crearon muchas cuentas desde esta conexión. Mañana vas a poder crear la tuya." };
    }

    const alta = await registrarPersona(validacionAlta.datos);
    if (!alta.ok) {
      return {
        erroresAlta: { telefono: "Ese número ya tiene una cuenta." },
        mensaje:
          "Si cambiaste de celular, el equipo de Humanitas te ayuda a recuperar tu cuenta. Lo encontrás en Ayuda, desde Mis publicaciones.",
      };
    }
    await guardarSesion(alta.token);
    persona = alta.persona;
  }

  const foto = formData.get("foto");
  let fotoUrl: string | null = null;
  if (foto instanceof File && foto.size > 0) {
    try {
      fotoUrl = await subirFoto(foto);
    } catch (e) {
      return { mensaje: e instanceof Error ? e.message : "No se pudo subir la foto." };
    }
  }

  const resultado = await crearPublicacion(persona.id, validacion.datos, fotoUrl);
  if (!resultado.ok) return { mensaje: MENSAJES[resultado.motivo] };

  redirect(`/publicar/listo?id=${resultado.id}`);
}
