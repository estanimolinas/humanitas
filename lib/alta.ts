import { normalizarTelefono } from "@/lib/telefono";

// Validación del alta mínima (7.5). Pura: la usan el formulario (para avisar antes) y la server
// action (que es la que manda).

export type CamposAlta = {
  nombre: string;
  telefono: string;
  zonaId: string;
  terminos: boolean;
  mayorDeEdad: boolean;
};

export type ErroresAlta = Partial<Record<keyof CamposAlta, string>>;

export type AltaValida = { nombre: string; telefono: string; telefonoLegible: string; zonaId: number | null };

export function validarAlta(
  campos: CamposAlta,
): { ok: true; datos: AltaValida } | { ok: false; errores: ErroresAlta } {
  const errores: ErroresAlta = {};

  const nombre = campos.nombre.trim().replace(/\s+/g, " ");
  if (nombre.length === 0) errores.nombre = "Nos falta tu nombre.";
  else if (nombre.length > 80) errores.nombre = "El nombre es un poco largo. ¿Lo acortamos?";

  const telefono = normalizarTelefono(campos.telefono);
  if (!telefono.ok) errores.telefono = telefono.error;

  let zonaId: number | null = null;
  if (campos.zonaId !== "") {
    zonaId = Number(campos.zonaId);
    if (!Number.isInteger(zonaId) || zonaId <= 0) errores.zonaId = "No encontramos ese barrio en la lista.";
  }

  if (!campos.terminos) errores.terminos = "Para continuar, necesitamos que aceptes los términos.";
  if (!campos.mayorDeEdad) errores.mayorDeEdad = "Humanitas está pensada para personas de 18 años o más.";

  if (Object.keys(errores).length > 0 || !telefono.ok) return { ok: false, errores };
  return { ok: true, datos: { nombre, telefono: telefono.normalizado, telefonoLegible: telefono.legible, zonaId } };
}

export function camposDesdeFormData(formData: FormData): CamposAlta {
  const texto = (clave: string) => {
    const v = formData.get(clave);
    return typeof v === "string" ? v : "";
  };
  return {
    nombre: texto("nombre"),
    telefono: texto("telefono"),
    zonaId: texto("zonaId"),
    terminos: formData.get("terminos") === "si",
    mayorDeEdad: formData.get("mayorDeEdad") === "si",
  };
}

/**
 * Solo rutas internas: evita que un link armado mande a la persona a otro sitio. Se interpreta
 * igual que el navegador (que borra tabs y saltos de línea y lee "\\" como "/"), así que
 * "/\t/otro.sitio" o "/\\otro.sitio" no pasan (auditoría 18/09/2026).
 */
export function volverSeguro(volver: unknown): string {
  if (typeof volver !== "string" || !volver.startsWith("/")) return "/";
  const base = "https://humanitas.invalid";
  try {
    const url = new URL(volver, base);
    if (url.origin !== base) return "/";
    return url.pathname + url.search;
  } catch {
    return "/";
  }
}
