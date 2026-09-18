import { NextResponse, type NextRequest } from "next/server";
import { nuevoNonce, origenDe, politicaCsp } from "@/lib/seguridad/cabeceras";
import { COOKIE_SESION, COOKIE_SESION_DESDE, DIAS_ROTACION_TOKEN } from "@/lib/sesion/constantes";
import { rotarSiHaceFalta } from "@/lib/sesion/rotacion";
import { opcionesCookieSesion } from "@/lib/sesion/token";

const DIA_MS = 24 * 60 * 60 * 1000;

// Corre en cada pantalla (no en los archivos estáticos):
// 1. En las rutas privadas, un chequeo optimista: solo mira si hay cookie. La validación real del
//    token la hace cada página y cada server action con personaActual(). Mirar nunca pide cuenta (R01).
// 2. Renueva el token de sesión cada DIAS_ROTACION_TOKEN días (11.5). Solo va a la base cuando la
//    cookie de fecha dice que toca (o falta).
// 3. Arma la CSP con un nonce nuevo por pedido (11.5).
export async function proxy(request: NextRequest) {
  const privada = request.nextUrl.pathname.startsWith("/mis-publicaciones");
  if (privada && !request.cookies.has(COOKIE_SESION)) {
    const alta = new URL("/alta", request.url);
    alta.searchParams.set("volver", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(alta);
  }

  const sesion = await revisarSesion(request);

  const nonce = nuevoNonce();
  const csp = politicaCsp({
    nonce,
    desarrollo: process.env.NODE_ENV === "development",
    origenFotos: origenDe(process.env.SUPABASE_URL),
  });

  // Next lee la CSP del pedido para ponerle el nonce a sus propios scripts. Las cabeceras se
  // copian después de revisar la sesión: si el token cambió, esta misma página ya usa el nuevo.
  const cabeceras = new Headers(request.headers);
  cabeceras.set("x-nonce", nonce);
  cabeceras.set("Content-Security-Policy", csp);

  const respuesta = NextResponse.next({ request: { headers: cabeceras } });
  respuesta.headers.set("Content-Security-Policy", csp);

  if (sesion.tipo === "invalida") {
    respuesta.cookies.delete(COOKIE_SESION);
    respuesta.cookies.delete(COOKIE_SESION_DESDE);
  } else if (sesion.tipo === "actualizar") {
    if (sesion.token) respuesta.cookies.set(COOKIE_SESION, sesion.token, opcionesCookieSesion());
    respuesta.cookies.set(COOKIE_SESION_DESDE, String(sesion.desde), opcionesCookieSesion());
  }
  return respuesta;
}

type EstadoSesion =
  | { tipo: "sin_cambios" }
  | { tipo: "invalida" }
  | { tipo: "actualizar"; token: string | null; desde: number };

async function revisarSesion(request: NextRequest): Promise<EstadoSesion> {
  const token = request.cookies.get(COOKIE_SESION)?.value;
  if (!token) return { tipo: "sin_cambios" };

  const desde = Number(request.cookies.get(COOKIE_SESION_DESDE)?.value);
  const alDia = Number.isFinite(desde) && desde > 0 && Date.now() - desde < DIAS_ROTACION_TOKEN * DIA_MS;
  if (alDia) return { tipo: "sin_cambios" };

  try {
    const r = await rotarSiHaceFalta(token);
    if (!r.valido) return { tipo: "invalida" };
    if (r.tokenNuevo) request.cookies.set(COOKIE_SESION, r.tokenNuevo);
    return { tipo: "actualizar", token: r.tokenNuevo, desde: r.emitidoEn };
  } catch {
    // Si la base no responde, la página sigue igual y se intenta en la próxima visita.
    return { tipo: "sin_cambios" };
  }
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
