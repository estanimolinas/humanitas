/** Antigüedad en lenguaje simple: "recién", "hace 3 horas", "hace 2 días" (7.1). */
export function antiguedad(fecha: string | Date, ahora: Date = new Date()): string {
  const minutos = Math.floor((ahora.getTime() - new Date(fecha).getTime()) / 60000);
  if (minutos < 5) return "recién";
  if (minutos < 60) return `hace ${minutos} minutos`;
  const horas = Math.floor(minutos / 60);
  if (horas === 1) return "hace 1 hora";
  if (horas < 24) return `hace ${horas} horas`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "hace 1 día";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "hace 1 mes" : `hace ${meses} meses`;
}
