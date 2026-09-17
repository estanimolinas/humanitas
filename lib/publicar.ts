import "server-only";
import { randomUUID } from "node:crypto";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { MAX_FOTO_BYTES, type PublicacionValida } from "@/lib/validar-publicacion";

export const BUCKET_FOTOS = "fotos";

export type MotivoRechazo = "limite_diario" | "limite_activas" | "rubro_invalido" | "rubro_no_corresponde";

export type ResultadoPublicar =
  | { ok: true; id: string }
  | { ok: false; motivo: MotivoRechazo };

/** Sube la foto al bucket público. El cliente ya la comprimió; acá se vuelve a controlar (R03). */
export async function subirFoto(archivo: File): Promise<string> {
  if (archivo.size > MAX_FOTO_BYTES) {
    throw new Error("La foto tiene que pesar menos de 200 KB.");
  }
  if (archivo.type !== "image/jpeg" && archivo.type !== "image/webp") {
    throw new Error("La foto tiene que ser JPG o WEBP.");
  }

  const extension = archivo.type === "image/webp" ? "webp" : "jpg";
  const ruta = `${randomUUID()}.${extension}`;
  const supabase = supabaseServidor();

  const { error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false });
  if (error) throw error;

  return supabase.storage.from(BUCKET_FOTOS).getPublicUrl(ruta).data.publicUrl;
}

/** Crea la publicación con los límites de 8.5 y la vigencia de 8.6 aplicados en la base. */
export async function crearPublicacion(
  personaId: string,
  datos: PublicacionValida,
  fotoUrl: string | null,
): Promise<ResultadoPublicar> {
  const { data, error } = await supabaseServidor().rpc("crear_publicacion", {
    p_persona_id: personaId,
    p_tipo: datos.tipo,
    p_subtipo: datos.subtipo,
    p_rubro_id: datos.rubroId,
    p_rubro_otro_texto: datos.rubroOtroTexto,
    p_titulo: datos.titulo,
    p_descripcion: datos.descripcion,
    p_precio_texto: datos.precioTexto,
    p_alias_pago: datos.aliasPago,
    p_foto_url: fotoUrl,
    p_zona_id: datos.zonaId,
    p_zona_otro_texto: datos.zonaOtroTexto,
  });
  if (error) throw error;

  const fila = (data as { publicacion_id: string | null; motivo_rechazo: MotivoRechazo | null }[])[0];
  if (!fila || fila.motivo_rechazo) {
    return { ok: false, motivo: fila?.motivo_rechazo ?? "rubro_invalido" };
  }
  return { ok: true, id: fila.publicacion_id! };
}
