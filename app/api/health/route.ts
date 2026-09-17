import { supabaseServidor } from "@/lib/supabase/servidor";

// Chequeo de disponibilidad (12.4). Un pinger gratuito lo consulta cada 5 minutos.
// Toca la base a propósito: así Supabase Free no pausa el proyecto por inactividad.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error } = await supabaseServidor().from("rubros").select("id").limit(1);
    if (error) throw error;
    return Response.json({ ok: true, base: "ok" });
  } catch {
    return Response.json({ ok: false, base: "sin respuesta" }, { status: 503 });
  }
}
