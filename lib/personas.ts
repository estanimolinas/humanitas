import "server-only";
import { generarToken, hashToken } from "@/lib/sesion/token";
import { supabaseServidor } from "@/lib/supabase/servidor";

/**
 * Lo que la app sabe de la persona con sesión. A propósito NO incluye el teléfono (R05):
 * el teléfono solo se lee en el servidor al armar el link de WhatsApp (paso 5).
 */
export type PersonaSesion = {
  id: string;
  nombre: string;
  zonaId: number | null;
  esOperador: boolean;
};

export type DatosAlta = {
  nombre: string;
  /** Ya normalizado con normalizarTelefono (549…). */
  telefono: string;
  zonaId: number | null;
};

export type ResultadoRegistro =
  | { ok: true; token: string; persona: PersonaSesion }
  | { ok: false; motivo: "telefono_existente" };

const COLUMNAS_SESION = "id, nombre, zona_id, es_operador";

type FilaSesion = { id: string; nombre: string; zona_id: number | null; es_operador: boolean };

const aPersonaSesion = (f: FilaSesion): PersonaSesion => ({
  id: f.id,
  nombre: f.nombre,
  zonaId: f.zona_id,
  esOperador: f.es_operador,
});

/** Alta mínima (7.5). Quien llama ya validó los datos y la aceptación de términos y mayoría de edad. */
export async function registrarPersona(datos: DatosAlta): Promise<ResultadoRegistro> {
  const token = generarToken();
  const { data, error } = await supabaseServidor()
    .from("personas")
    .insert({
      nombre: datos.nombre,
      telefono: datos.telefono,
      zona_id: datos.zonaId,
      token_hash: hashToken(token),
      terminos_aceptados_en: new Date().toISOString(),
      mayoria_edad_declarada: true,
    })
    .select(COLUMNAS_SESION)
    .single<FilaSesion>();

  if (error) {
    // 8.5: un teléfono = una cuenta.
    if (error.code === "23505" && error.message.includes("personas_telefono_key")) {
      return { ok: false, motivo: "telefono_existente" };
    }
    throw error;
  }
  return { ok: true, token, persona: aPersonaSesion(data) };
}

export async function buscarPersonaPorToken(token: string): Promise<PersonaSesion | null> {
  const { data, error } = await supabaseServidor()
    .from("personas")
    .select(COLUMNAS_SESION)
    .eq("token_hash", hashToken(token))
    .is("archivado_en", null)
    .maybeSingle<FilaSesion>();
  if (error) throw error;
  return data ? aPersonaSesion(data) : null;
}
