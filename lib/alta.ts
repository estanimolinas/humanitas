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
  if (nombre.length === 0) errores.nombre = "Escribí tu nombre.";
  else if (nombre.length > 80) errores.nombre = "El nombre es muy largo.";

  const telefono = normalizarTelefono(campos.telefono);
  if (!telefono.ok) errores.telefono = telefono.error;

  let zonaId: number | null = null;
  if (campos.zonaId !== "") {
    zonaId = Number(campos.zonaId);
    if (!Number.isInteger(zonaId) || zonaId <= 0) errores.zonaId = "Elegí un barrio de la lista.";
  }

  if (!campos.terminos) errores.terminos = "Para seguir, marcá que aceptás los términos.";
  if (!campos.mayorDeEdad) errores.mayorDeEdad = "Humanitas es solo para personas de 18 años o más.";

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

/** Solo rutas internas: evita que un link armado mande a la persona a otro sitio. */
export function volverSeguro(volver: unknown): string {
  if (typeof volver !== "string") return "/";
  if (!volver.startsWith("/") || volver.startsWith("//") || volver.startsWith("/\\")) return "/";
  return volver;
}
