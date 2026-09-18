import Link from "next/link";

/** Encabezado de todas las pantallas (guía visual, sección 3). */
export function Encabezado({ subtitulo = "Tecnología al servicio de la humanidad" }: { subtitulo?: string }) {
  return (
    <header className="encabezado">
      <div className="mx-auto w-full max-w-[var(--ancho-pagina)] px-4 py-3 sm:px-6">
        <Link href="/" className="inline-block">
          <span className="block text-[17px] font-semibold leading-tight sm:text-xl">Humanitas</span>
          <span className="mt-px block text-[13px] tracking-[0.02em] text-texto-2 sm:text-sm">{subtitulo}</span>
        </Link>
      </div>
    </header>
  );
}
