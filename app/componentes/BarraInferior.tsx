"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SOLAPAS = [
  { href: "/", texto: "Inicio", icono: "M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" },
  { href: "/publicar", texto: "Publicar", icono: "M12 5v14M5 12h14" },
  { href: "/mis-publicaciones", texto: "Mis publicaciones", icono: "M4 5h16M4 12h16M4 19h10" },
];

/** Barra inferior con las tres pantallas principales (guía visual). La activa va en dorado, como en el mockup. */
export function BarraInferior() {
  const ruta = usePathname();
  const activa = (href: string) => (href === "/" ? ruta === "/" || ruta.startsWith("/p/") : ruta.startsWith(href));

  return (
    <nav aria-label="Secciones" className="sticky bottom-0 border-t divisor bg-fondo">
      <div className="mx-auto grid w-full max-w-[var(--ancho-pagina)] grid-cols-3">
        {SOLAPAS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            aria-current={activa(s.href) ? "page" : undefined}
            className={`flex min-h-15 flex-col items-center justify-center gap-1 px-2 py-2 text-center text-xs ${
              activa(s.href) ? "font-semibold text-dorado-oscuro" : "text-texto-2"
            }`}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d={s.icono} />
            </svg>
            {s.texto}
          </Link>
        ))}
      </div>
    </nav>
  );
}
