// Validación de Publicar (7.3). Pura: la usan el formulario y la server action.

import type { Subtipo, Tipo } from "@/lib/publicaciones-tipos";

export const MAX_TITULO = 60;
export const MAX_DESCRIPCION = 500;
export const MAX_FOTO_BYTES = 200 * 1024; // R03

export type CamposPublicacion = {
  tipo: Tipo | "";
  subtipo: Subtipo | "";
  rubroId: string;
  rubroOtroTexto: string;
  titulo: string;
  descripcion: string;
  precioTexto: string;
  aliasPago: string;
  zonaId: string;
  zonaOtroTexto: string;
};

export type ErroresPublicacion = Partial<Record<keyof CamposPublicacion, string>>;

export const camposVacios: CamposPublicacion = {
  tipo: "",
  subtipo: "",
  rubroId: "",
  rubroOtroTexto: "",
  titulo: "",
  descripcion: "",
  precioTexto: "",
  aliasPago: "",
  zonaId: "",
  zonaOtroTexto: "",
};

export type PublicacionValida = {
  tipo: Tipo;
  subtipo: Subtipo | null;
  rubroId: number;
  rubroOtroTexto: string | null;
  titulo: string;
  descripcion: string | null;
  precioTexto: string | null;
  aliasPago: string | null;
  zonaId: number | null;
  zonaOtroTexto: string | null;
};

const limpio = (t: string) => t.trim().replace(/\s+/g, " ");

/** Paso 1: qué querés hacer. */
export function validarPaso1(c: CamposPublicacion): ErroresPublicacion {
  const errores: ErroresPublicacion = {};
  if (c.tipo !== "ofrezco" && c.tipo !== "necesito") errores.tipo = "Falta elegir una de las dos opciones.";
  else if (c.tipo === "ofrezco" && c.subtipo !== "servicio" && c.subtipo !== "producto") {
    errores.subtipo = "Falta indicar si es un servicio o un producto.";
  }
  return errores;
}

/** Paso 2: contanos. Rubro y título son obligatorios; el resto es opcional. */
export function validarPaso2(c: CamposPublicacion, rubroEsOtros = false): ErroresPublicacion {
  const errores: ErroresPublicacion = {};
  const rubro = Number(c.rubroId);
  if (!Number.isInteger(rubro) || rubro <= 0) errores.rubroId = "Falta elegir un rubro.";
  if (rubroEsOtros && limpio(c.rubroOtroTexto).length === 0) {
    errores.rubroOtroTexto = "Falta indicar de qué se trata.";
  } else if (limpio(c.rubroOtroTexto).length > 80) {
    errores.rubroOtroTexto = "El texto supera el largo permitido.";
  }

  const titulo = limpio(c.titulo);
  if (titulo.length === 0) errores.titulo = "Falta un título corto.";
  else if (titulo.length > MAX_TITULO) errores.titulo = `Máximo ${MAX_TITULO} caracteres.`;

  if (c.descripcion.length > MAX_DESCRIPCION) {
    errores.descripcion = `Máximo ${MAX_DESCRIPCION} caracteres.`;
  }
  if (limpio(c.precioTexto).length > 80) errores.precioTexto = "El texto supera el largo permitido.";
  if (limpio(c.aliasPago).length > 80) errores.aliasPago = "El texto supera el largo permitido.";
  return errores;
}

/** Paso 3: dónde. Todo opcional (B5). */
export function validarPaso3(c: CamposPublicacion): ErroresPublicacion {
  const errores: ErroresPublicacion = {};
  if (c.zonaId && c.zonaOtroTexto) {
    errores.zonaOtroTexto = "Se puede elegir un barrio de la lista o escribir otro, pero no las dos cosas.";
  }
  if (limpio(c.zonaOtroTexto).length > 80) errores.zonaOtroTexto = "El texto supera el largo permitido.";
  return errores;
}

export function validarPublicacion(
  c: CamposPublicacion,
  rubroEsOtros = false,
): { ok: true; datos: PublicacionValida } | { ok: false; errores: ErroresPublicacion } {
  const errores = {
    ...validarPaso1(c),
    ...validarPaso2(c, rubroEsOtros),
    ...validarPaso3(c),
  };
  if (Object.keys(errores).length > 0) return { ok: false, errores };

  const texto = (t: string) => (limpio(t).length > 0 ? limpio(t) : null);
  return {
    ok: true,
    datos: {
      tipo: c.tipo as Tipo,
      subtipo: c.tipo === "ofrezco" ? (c.subtipo as Subtipo) : null,
      rubroId: Number(c.rubroId),
      rubroOtroTexto: rubroEsOtros ? texto(c.rubroOtroTexto) : null,
      titulo: limpio(c.titulo),
      descripcion: c.descripcion.trim().length > 0 ? c.descripcion.trim() : null,
      precioTexto: texto(c.precioTexto),
      aliasPago: texto(c.aliasPago),
      zonaId: c.zonaId ? Number(c.zonaId) : null,
      zonaOtroTexto: c.zonaId ? null : texto(c.zonaOtroTexto),
    },
  };
}

export function camposDesdeFormData(formData: FormData): CamposPublicacion {
  const t = (clave: keyof CamposPublicacion) => {
    const v = formData.get(clave);
    return typeof v === "string" ? v : "";
  };
  return {
    tipo: t("tipo") as CamposPublicacion["tipo"],
    subtipo: t("subtipo") as CamposPublicacion["subtipo"],
    rubroId: t("rubroId"),
    rubroOtroTexto: t("rubroOtroTexto"),
    titulo: t("titulo"),
    descripcion: t("descripcion"),
    precioTexto: t("precioTexto"),
    aliasPago: t("aliasPago"),
    zonaId: t("zonaId"),
    zonaOtroTexto: t("zonaOtroTexto"),
  };
}
