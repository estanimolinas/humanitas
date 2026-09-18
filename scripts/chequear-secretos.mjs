// Chequeo de secretos en el build (paso 11.5, punto 5). Correr después de `npm run build`:
//   npm run chequear:secretos
// Falla si la service role key de Supabase (o cualquier JWT con rol service_role) aparece en
// algún archivo que baja al navegador (.next/static).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

try {
  process.loadEnvFile(".env.local");
} catch {
  // En la nube las variables ya están en el entorno.
}

const carpeta = ".next/static";
if (!existsSync(carpeta)) {
  console.error("No hay build: correr `npm run build` antes.");
  process.exit(1);
}

const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
const buscados = [
  ...(clave ? [{ que: "SUPABASE_SERVICE_ROLE_KEY", texto: clave }] : []),
  // "role":"service_role" en base64, tal como aparece dentro de un JWT.
  { que: "un JWT con rol service_role", texto: "InJvbGUiOiJzZXJ2aWNlX3JvbGUi" },
  { que: "el nombre de la variable de la key", texto: "SUPABASE_SERVICE_ROLE_KEY" },
];

const archivos = [];
const recorrer = (ruta) => {
  if (statSync(ruta).isDirectory()) readdirSync(ruta).forEach((e) => recorrer(join(ruta, e)));
  else archivos.push(ruta);
};
recorrer(carpeta);

const hallazgos = [];
for (const archivo of archivos) {
  const contenido = readFileSync(archivo, "utf8");
  for (const b of buscados) if (contenido.includes(b.texto)) hallazgos.push(`${archivo}: ${b.que}`);
}

if (hallazgos.length > 0) {
  console.error("Secretos en archivos que van al navegador:\n" + hallazgos.join("\n"));
  process.exit(1);
}
console.log(`Sin secretos en ${archivos.length} archivos de .next/static.`);
