import type { Subtipo } from "@/lib/publicaciones-tipos";

/**
 * Los oficios dibujados (decisión 19/09/2026): un dibujo de línea por rubro, el idioma visual
 * propio de Humanitas. Se reconoce antes de leer, lo que ayuda a quien lee con esfuerzo.
 * Trazos en una grilla de 24 × 24. Son constantes del código (nunca texto de nadie), por eso se
 * insertan tal cual.
 */
const TRAZOS: Record<string, string> = {
  "Albañilería y construcción":
    '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>',
  Pintura:
    '<rect x="3.5" y="3" width="14" height="5.5" rx="1.5"/><path d="M17.5 5.75h2.5v5.25h-9v2.5"/><rect x="9.5" y="13.5" width="3" height="7.5" rx="1"/>',
  "Electricidad y plomería": '<path d="M13.5 2.5 5 13.5h6.5L10.5 21.5 19 10.5h-6.5z"/>',
  "Gas y calefacción":
    '<path d="M12 21.5a6 6 0 0 0 6-6c0-4.5-3.5-6.5-4.5-11-2.5 2-4 4.5-4 7-1-.8-1.5-2-1.7-3.2C6.8 10 6 12.3 6 15.5a6 6 0 0 0 6 6z"/><path d="M12 21.5a2.5 2.5 0 0 1-2.5-2.5c0-2 2.5-3.5 2.5-5.5 0 2 2.5 3.5 2.5 5.5a2.5 2.5 0 0 1-2.5 2.5z"/>',
  "Jardinería y poda":
    '<path d="M12 21V11"/><path d="M12 11C12 7 9.5 4.5 5 4.5c0 4.3 2.7 6.5 7 6.5z"/><path d="M12 14c0-3.3 2.4-5.5 6.5-5.5 0 3.7-2.6 5.5-6.5 5.5z"/><path d="M7 21h10"/>',
  "Limpieza (hogar y comercios)":
    '<path d="M19 3 12.5 11"/><path d="M12.5 11l-4.2-1.3L4 17.5l3 1.2 1-2-.3 3.1 3.3 1.2 1.2-2.3v2.6l2.3.7L16 14z"/>',
  "Mudanzas y fletes":
    '<rect x="2" y="6.5" width="12" height="9.5" rx="1"/><path d="M14 9.5h4l3 3.5v3h-7"/><circle cx="6.5" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  "Peluquería y estética":
    '<circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M8.2 7.4 20 16.5M8.2 16.6 20 7.5"/>',
  "Costura y arreglos de ropa":
    '<path d="M6.5 4h11M6.5 20h11"/><rect x="8" y="4" width="8" height="16"/><path d="M8 8.5 16 7M8 12.5l8-1.5M8 16.5l8-1.5"/>',
  "Cuidado de personas (niños, adultos mayores)":
    '<path d="M12 20s-7.5-4.6-7.5-10.2A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>',
  "Mecánica y bicicletas":
    '<circle cx="6" cy="16" r="3.8"/><circle cx="18" cy="16" r="3.8"/><path d="M6 16 10 8.5h6.5L18 16M10 8.5 13 16H6M8.5 6h3M16.5 8.5 16 6h2"/>',
  "Clases y apoyo escolar":
    '<path d="M3 5h5.5A3.5 3.5 0 0 1 12 8.5V20a2.5 2.5 0 0 0-2.5-2.5H3z"/><path d="M21 5h-5.5A3.5 3.5 0 0 0 12 8.5V20a2.5 2.5 0 0 1 2.5-2.5H21z"/>',
  "Panadería y pastelería":
    '<path d="M4 11.5A4.5 4.5 0 0 1 8.5 7h7a4.5 4.5 0 0 1 4.5 4.5 2 2 0 0 1-1 1.8V19H5v-5.7a2 2 0 0 1-1-1.8z"/><path d="M8.5 10l1 2.2M12 10l1 2.2M15.5 10l1 2.2"/>',
  "Carnicería y pollería":
    '<path d="M10 14.5C7.2 11.8 8 6.5 11.8 4.6c4-2 9.2.6 8.7 5-.4 3.9-5.3 6-8.2 5.5z"/><path d="M10.6 13.6 6.8 17.4"/><circle cx="5.2" cy="17.1" r="1.5"/><circle cx="7.1" cy="19" r="1.5"/>',
  Verdulería:
    '<path d="M12 7.5c-2-2-7.5-1.8-7.5 4 0 4.3 3.2 9 5.3 9 1 0 1.5-.6 2.2-.6s1.2.6 2.2.6c2.1 0 5.3-4.7 5.3-9 0-5.8-5.5-6-7.5-4z"/><path d="M12 7.5V4.5"/><path d="M12 5.5c1-2 3.2-2.3 4.5-1.2-1.2 1.6-3.3 1.8-4.5 1.2z"/>',
  "Comidas y viandas":
    '<path d="M4 11h16v4.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 15.5z"/><path d="M2 11h2M20 11h2M9 3.5c0 1.5 1 1.5 1 3.2M14 3.5c0 1.5 1 1.5 1 3.2"/>',
  "Almacén y despensa":
    '<path d="M4 9 5.5 4h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5V20h13v-8.5M10 20v-5h4v5"/>',
  Artesanías:
    '<path d="M9 3.5h6M10 3.5c0 2-3.2 3-3.7 6.7C5.8 14.6 7.7 20.5 12 20.5s6.2-5.9 5.7-10.3C17.2 6.5 14 5.5 14 3.5"/><path d="M6.6 12.5 8 14l1.3-1.5 1.4 1.5 1.3-1.5 1.3 1.5 1.4-1.5 1.3 1.5 1.4-1.5"/>',
  "Ropa y calzado":
    '<path d="M8.5 4 3.5 6.8l1.8 4 2.7-1V20h8V9.8l2.7 1 1.8-4L15.5 4a3.5 3.5 0 0 1-7 0z"/>',
};

/** "Otros" y cualquier rubro nuevo sin dibujo propio: la caja de herramientas o la bolsa. */
const OTROS_SERVICIOS =
  '<rect x="3" y="8" width="18" height="12" rx="1.5"/><path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18M11 13v2h2v-2"/>';
const OTROS_PRODUCTOS = '<path d="M5 8h14l-1.2 12.5H6.2z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>';

function trazosDe(rubro: string, familia: Subtipo | null): string {
  return TRAZOS[rubro] ?? (familia === "producto" ? OTROS_PRODUCTOS : OTROS_SERVICIOS);
}

/** El dibujo solo, del color del texto que lo rodea. */
export function DibujoOficio({ rubro, familia, className = "size-6" }: {
  rubro: string;
  familia: Subtipo | null;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: trazosDe(rubro, familia) }}
    />
  );
}

/** El dibujo en su círculo dorado claro (listado, detalle, Mis publicaciones). */
export function Oficio({ rubro, familia, tamanio = "size-12" }: {
  rubro: string;
  familia: Subtipo | null;
  tamanio?: string;
}) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-dorado-claro text-dorado-oscuro ${tamanio}`}
    >
      <DibujoOficio rubro={rubro} familia={familia} className="size-[58%]" />
    </span>
  );
}

/** El símbolo de Humanitas: dos círculos que se tocan, el encuentro entre dos personas. */
export function Simbolo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={2.2}>
      <circle cx="15" cy="20" r="10" />
      <circle cx="25" cy="20" r="10" />
    </svg>
  );
}
