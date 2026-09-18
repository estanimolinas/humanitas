import "server-only";
import { supabaseServidor } from "@/lib/supabase/servidor";
import type { Subtipo, Tipo } from "@/lib/publicaciones-tipos";

export type EstadoPublicacion = "activa" | "cerrada" | "en_revision" | "archivada";

export type PublicacionPropia = {
  id: string;
  tipo: Tipo;
  subtipo: Subtipo | null;
  titulo: string;
  descripcion: string | null;
  precioTexto: string | null;
  aliasPago: string | null;
  estado: EstadoPublicacion;
  cierreMotivo: string | null;
  creadaEn: string;
  venceEn: string | null;
  rubro: string;
  zona: string | null;
  zonaId: number | null;
  contactos: number;
};

type Fila = {
  id: string;
  tipo: Tipo;
  subtipo: Subtipo | null;
  titulo: string;
  descripcion: string | null;
  precio_texto: string | null;
  alias_pago: string | null;
  estado: EstadoPublicacion;
  cierre_motivo: string | null;
  creada_en: string;
  vence_en: string | null;
  zona_id: number | null;
  zona_otro_texto: string | null;
  rubros: { nombre: string } | null;
  zonas: { nombre: string } | null;
  contactos: { count: number }[];
};

/** Las publicaciones propias, con su estado (7.4). */
export async function publicacionesPropias(personaId: string): Promise<PublicacionPropia[]> {
  const { data, error } = await supabaseServidor()
    .from("publicaciones")
    .select(
      `id, tipo, subtipo, titulo, descripcion, precio_texto, alias_pago, estado, cierre_motivo,
       creada_en, vence_en, zona_id, zona_otro_texto,
       rubros ( nombre ), zonas ( nombre ), contactos ( count )`,
    )
    .eq("persona_id", personaId)
    .is("archivado_en", null)
    .order("creada_en", { ascending: false })
    .returns<Fila[]>();
  if (error) throw error;

  return (data ?? []).map((f) => ({
    id: f.id,
    tipo: f.tipo,
    subtipo: f.subtipo,
    titulo: f.titulo,
    descripcion: f.descripcion,
    precioTexto: f.precio_texto,
    aliasPago: f.alias_pago,
    estado: f.estado,
    cierreMotivo: f.cierre_motivo,
    creadaEn: f.creada_en,
    venceEn: f.vence_en,
    rubro: f.rubros?.nombre ?? "",
    zona: f.zonas?.nombre ?? f.zona_otro_texto,
    zonaId: f.zona_id,
    contactos: f.contactos?.[0]?.count ?? 0,
  }));
}

export type PerfilPropio = { barrio: string | null; desde: string };

/** Encabezado del perfil (mockup "Mi perfil"): barrio y desde cuándo. Sin teléfono (R05). */
export async function perfilPropio(personaId: string): Promise<PerfilPropio> {
  const { data, error } = await supabaseServidor()
    .from("personas")
    .select("creada_en, zonas ( nombre )")
    .eq("id", personaId)
    .single<{ creada_en: string; zonas: { nombre: string } | null }>();
  if (error) throw error;
  return { barrio: data.zonas?.nombre ?? null, desde: data.creada_en };
}

export type QuienContacto = { id: string; nombre: string; cuando: string };

/** Personas que pidieron contacto por esta publicación: entre ellas se elige quién lo hizo (7.4). */
export async function quienesContactaron(
  publicacionId: string,
  duenioId: string,
): Promise<QuienContacto[]> {
  const { data, error } = await supabaseServidor()
    .from("contactos")
    .select("creada_en, personas!contactos_persona_solicitante_id_fkey ( id, nombre )")
    .eq("publicacion_id", publicacionId)
    .is("archivado_en", null)
    .order("creada_en", { ascending: false })
    .returns<{ creada_en: string; personas: { id: string; nombre: string } | null }[]>();
  if (error) throw error;

  const vistas = new Set<string>();
  const gente: QuienContacto[] = [];
  for (const fila of data ?? []) {
    const p = fila.personas;
    if (!p || p.id === duenioId || vistas.has(p.id)) continue;
    vistas.add(p.id);
    gente.push({ id: p.id, nombre: p.nombre, cuando: fila.creada_en });
  }
  return gente;
}

type Resultado = { ok: true } | { ok: false; motivo: string };

async function llamar(
  funcion: "cerrar_publicacion" | "reactivar_publicacion",
  argumentos: Record<string, unknown>,
): Promise<Resultado> {
  const { data, error } = await supabaseServidor().rpc(funcion, argumentos);
  if (error) throw error;
  const fila = (data as { ok: boolean; motivo_rechazo: string | null }[])[0];
  return fila?.ok ? { ok: true } : { ok: false, motivo: fila?.motivo_rechazo ?? "desconocido" };
}

/** Cierra una publicación propia. Con "resuelta con alguien de acá" suma el concretado (8.4, D2). */
export function cerrarPublicacion(
  publicacionId: string,
  personaId: string,
  motivo: string,
  personaQueHizoId: string | null = null,
): Promise<Resultado> {
  return llamar("cerrar_publicacion", {
    p_publicacion_id: publicacionId,
    p_persona_id: personaId,
    p_motivo: motivo,
    p_persona_que_hizo_id: personaQueHizoId,
  });
}

export function reactivarPublicacion(publicacionId: string, personaId: string): Promise<Resultado> {
  return llamar("reactivar_publicacion", {
    p_publicacion_id: publicacionId,
    p_persona_id: personaId,
  });
}

export type CamposEditables = {
  titulo: string;
  descripcion: string | null;
  precioTexto: string | null;
  aliasPago: string | null;
  zonaId: number | null;
  zonaOtroTexto: string | null;
};

/** Editar una publicación propia (7.4). La condición por persona_id es la que impide tocar ajenas. */
export async function editarPublicacion(
  publicacionId: string,
  personaId: string,
  campos: CamposEditables,
): Promise<boolean> {
  const { data, error } = await supabaseServidor()
    .from("publicaciones")
    .update({
      titulo: campos.titulo,
      descripcion: campos.descripcion,
      precio_texto: campos.precioTexto,
      alias_pago: campos.aliasPago,
      zona_id: campos.zonaId,
      zona_otro_texto: campos.zonaOtroTexto,
    })
    .eq("id", publicacionId)
    .eq("persona_id", personaId)
    // Solo activas: una publicación en revisión no se retoca antes de que la vea el equipo.
    .eq("estado", "activa")
    .is("archivado_en", null)
    .select("id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

/** Datos de la persona (7.4): nombre, barrio y, si se cambia, el teléfono. */
export async function actualizarPersona(
  personaId: string,
  datos: { nombre: string; telefono: string | null; zonaId: number | null },
): Promise<{ ok: true } | { ok: false; motivo: "telefono_existente" }> {
  const cambios = {
    nombre: datos.nombre,
    zona_id: datos.zonaId,
    ...(datos.telefono ? { telefono: datos.telefono } : {}),
  };
  const { error } = await supabaseServidor().from("personas").update(cambios).eq("id", personaId);
  if (error) {
    if (error.code === "23505") return { ok: false, motivo: "telefono_existente" };
    throw error;
  }
  return { ok: true };
}
