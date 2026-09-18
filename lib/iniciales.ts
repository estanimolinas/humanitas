/** Iniciales para el círculo del perfil, como en el mockup ("MB"). Hasta dos letras. */
export function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return "";
  const primera = palabras[0][0];
  const segunda = palabras.length > 1 ? palabras[palabras.length - 1][0] : (palabras[0][1] ?? "");
  return (primera + segunda).toUpperCase();
}
