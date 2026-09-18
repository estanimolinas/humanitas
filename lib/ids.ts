/** ¿Tiene forma de UUID? Lo que no, ni se manda a la base (evita errores 500 con ids inventados). */
export function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}
