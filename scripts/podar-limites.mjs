// Poda de la tabla limites (paso 11.5). Los intentos de más de 2 días ya no cuentan para ningún
// máximo (la ventana es de 24 horas). Es, con la poda de eventos, la única excepción a la regla
// de no borrar filas (CLAUDE.md, regla 1). Lo corre el equipo a mano, por ejemplo una vez por mes.
//
//   npm run podar:limites
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // En la nube las variables ya están en el entorno.
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const limite = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
const { count, error } = await supabase
  .from("limites")
  .delete({ count: "exact" })
  .lt("creada_en", limite);
if (error) throw error;
console.log(`Podados ${count ?? 0} intentos de más de 2 días.`);
