// Tipos y constantes del listado. Sin código de servidor a propósito: los usa también el
// componente cliente, y así supabase-js nunca entra en el bundle del navegador (R13).

export const POR_PAGINA = 10; // decisión 14/09/2026

export type Tipo = "necesito" | "ofrezco";
export type Subtipo = "servicio" | "producto";

export type FiltrosListado = {
  tipo: Tipo;
  subtipo?: Subtipo | null;
  rubroId?: number | null;
};

/** Una fila del listado. Nunca incluye el teléfono de nadie (R05). */
export type PublicacionListada = {
  id: string;
  tipo: Tipo;
  subtipo: Subtipo | null;
  titulo: string;
  descripcion: string | null;
  precio_texto: string | null;
  foto_url: string | null;
  creada_en: string;
  rubro: string;
  zona: string | null;
  persona_nombre: string;
  verificado_lugar: string | null;
  concretados: number;
  contactos_mes: number;
};
