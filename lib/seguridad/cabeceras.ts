/**
 * Cabeceras de seguridad (paso 11.5, punto 1). Puro, para poder testearlo.
 *
 * La CSP usa un nonce por pedido (guía de Next 16, "Content Security Policy"): solo corren los
 * scripts que trae la propia app. Lo arma proxy.ts en cada pantalla.
 */

/** Adónde puede salir un formulario: la app y WhatsApp (Contactar redirige a wa.me). */
const DESTINOS_DE_FORMULARIO = ["https://wa.me", "https://api.whatsapp.com"];

export function nuevoNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/** Origen de las fotos (Supabase Storage). Si la URL no es válida, las fotos no se permiten. */
export function origenDe(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function politicaCsp(opciones: {
  nonce: string;
  desarrollo: boolean;
  origenFotos: string | null;
}): string {
  const { nonce, desarrollo, origenFotos } = opciones;
  const directivas = [
    "default-src 'self'",
    // En desarrollo React usa eval para mostrar mejor los errores; en producción no.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${desarrollo ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    // blob: es la vista previa de la foto antes de subirla.
    `img-src 'self' blob: data:${origenFotos ? ` ${origenFotos}` : ""}`,
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    `form-action 'self' ${DESTINOS_DE_FORMULARIO.join(" ")}`,
    "frame-ancestors 'none'",
    ...(desarrollo ? [] : ["upgrade-insecure-requests"]),
  ];
  return directivas.join("; ");
}

/** Cabeceras que no cambian por pedido. Van en next.config para todas las rutas. */
export const CABECERAS_FIJAS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // La cámara no hace falta: la foto se saca con el selector de archivos del celular.
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];
