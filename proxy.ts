import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION } from "@/lib/sesion/constantes";

// Chequeo optimista: solo mira si hay cookie, sin ir a la base. La validación real del token la
// hace cada página y cada server action con personaActual().
// Corre solo en las rutas privadas: mirar el tablón nunca pasa por acá (R01).
export function proxy(request: NextRequest) {
  if (request.cookies.has(COOKIE_SESION)) return NextResponse.next();

  const alta = new URL("/alta", request.url);
  alta.searchParams.set("volver", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(alta);
}

export const config = {
  matcher: ["/mis-publicaciones/:path*", "/operador/:path*", "/referente/:path*"],
};
