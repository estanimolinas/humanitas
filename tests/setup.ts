// Los tests usan las mismas variables que la app (apuntan a Supabase local).
try {
  process.loadEnvFile(".env.local");
} catch {
  // Sin .env.local los tests que usan supabase-js fallan con un mensaje claro (ver README).
}
