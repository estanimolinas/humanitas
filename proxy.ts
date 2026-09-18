import { NextResponse, type NextRequest } from "next/server";
import { nuevoNonce, origenDe, politicaCsp } from "@/lib/seguridad/cabeceras";
import { COOKIE_SESION } from "@/lib/sesion/constantes";

// Corre en cada pantalla (no en los archivos estáticos):
// 1. Arma la CSP con un nonce nuevo por pedido (paso 11.5).
// 2. En las rutas privadas, un chequeo optimista: solo mira si hay cookie, sin ir a la base. La
//    validación real del token la hace cada página y cada server action con personaActual().
//    Mirar la lista nunca pide cuenta (R01).
export function proxy(request: NextRequest) {
  const privada = request.nextUrl.pathname.startsWith("/mis-publicaciones");
  if (privada && !request.cookies.has(COOKIE_SESION)) {
    const alta = new URL("/alta", request.url);
    alta.searchParams.set("volver", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(alta);
  }

  const nonce = nuevoNonce();
  const csp = politicaCsp({
    nonce,
    desarrollo: process.env.NODE_ENV === "development",
    origenFotos: origenDe(process.env.SUPABASE_URL),
  });

  // Next lee la CSP del pedido para ponerle el nonce a sus propios scripts.
  const cabeceras = new Headers(request.headers);
  cabeceras.set("x-nonce", nonce);
  cabeceras.set("Content-Security-Policy", csp);

  const respuesta = NextResponse.next({ request: { headers: cabeceras } });
  respuesta.headers.set("Content-Security-Policy", csp);
  return respuesta;
}

export const config = {
  matcher: [
    {
      // Todo menos la API, los archivos estáticos, los íconos, el manifest y el service worker.
      source: "/((?!api|_next/static|_next/image|favicon.ico|icono-|manifest.webmanifest|sw.js).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
