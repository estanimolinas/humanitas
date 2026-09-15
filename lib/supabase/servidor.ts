import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Único punto de acceso a Supabase. Solo servidor, con la service role (ver CLAUDE.md).
// El navegador nunca recibe esta key ni habla con Supabase.
let cliente: SupabaseClient | undefined;

export function supabaseServidor(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Ver .env.example y el README.");
  }
  cliente = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return cliente;
}
