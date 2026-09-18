// Dar de baja una cuenta a pedido de la persona (Ley 25.326, 10.6). Lo corre el equipo cuando
// alguien lo pide por el WhatsApp del equipo.
//
//   node scripts/dar-de-baja.mjs <celular de la persona> <celular de quien opera>
//   node scripts/dar-de-baja.mjs "342 512 3456" "342 555 0000"
//
// Quien opera tiene que ser una cuenta con es_operador = true. La función dar_de_baja borra el
// teléfono y el nombre, invalida la sesión, archiva y limpia sus publicaciones y deja todo
// registrado en acciones_operador. Después este script borra sus fotos del Storage.
// Usa .env.local (local) o las variables del entorno (nube).
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // En la nube las variables ya están en el entorno.
}

/** Igual que lib/telefono.ts, en corto: 549 + característica + número. */
function normalizar(entrada) {
  let d = String(entrada).replace(/\D/g, "");
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("9")) d = d.slice(1);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10) throw new Error(`No es un celular válido: ${entrada}`);
  return `549${d}`;
}

const [celularPersona, celularOperador] = process.argv.slice(2);
if (!celularPersona || !celularOperador) {
  console.error('Uso: node scripts/dar-de-baja.mjs "<celular de la persona>" "<celular de quien opera>"');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function idPorCelular(celular) {
  const { data, error } = await supabase
    .from("personas")
    .select("id, nombre")
    .eq("telefono", normalizar(celular))
    .is("archivado_en", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`No hay una cuenta activa con el celular ${celular}.`);
  return data;
}

const persona = await idPorCelular(celularPersona);
const operador = await idPorCelular(celularOperador);

const { data, error } = await supabase.rpc("dar_de_baja", {
  p_persona_id: persona.id,
  p_operador_id: operador.id,
});
if (error) throw error;
const r = data?.[0];
if (!r?.ok) {
  console.error(`No se pudo dar de baja: ${r?.motivo_rechazo ?? "sin respuesta"}`);
  process.exit(1);
}

// Las fotos son datos de la persona: se borran del Storage (no es una tabla de la app).
const rutas = (r.fotos ?? []).map((url) => url.split("/object/public/fotos/")[1]).filter(Boolean);
if (rutas.length > 0) {
  const { error: errorFotos } = await supabase.storage.from("fotos").remove(rutas);
  if (errorFotos) console.error(`La cuenta quedó dada de baja, pero no se borraron las fotos: ${errorFotos.message}`);
}

console.log(`Listo: la cuenta de ${persona.nombre} quedó dada de baja (${rutas.length} fotos borradas).`);
