import Link from "next/link";

/** Barra inferior con las tres pantallas principales (guía visual). Sin scroll infinito ni badges. */
export function BarraInferior() {
  const solapas = [
    { href: "/", texto: "Inicio", icono: "M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" },
    { href: "/publicar", texto: "Publicar", icono: "M12 5v14M5 12h14" },
    { href: "/mis-publicaciones", texto: "Mis publicaciones", icono: "M4 5h16M4 12h16M4 19h10" },
  ];

  return (
    <nav aria-label="Secciones" className="sticky bottom-0 border-t divisor bg-fondo">
      <div className="mx-auto grid w-full max-w-[var(--ancho-pagina)] grid-cols-3">
        {solapas.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex min-h-15 flex-col items-center justify-center gap-1 px-2 py-2 text-center text-xs text-texto-2"
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
