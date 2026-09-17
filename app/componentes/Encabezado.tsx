import Link from "next/link";

/** Encabezado de todas las pantallas (guía visual, sección 3). */
export function Encabezado({ subtitulo = "Norte de Santa Fe" }: { subtitulo?: string }) {
  return (
    <header className="encabezado">
      <div className="mx-auto w-full max-w-[var(--ancho-pagina)] px-4 py-3 sm:px-6">
        <Link href="/" className="inline-block">
          <span className="block text-[17px] font-semibold leading-tight sm:text-xl">Humanitas</span>
          <span className="mt-px block text-sm text-texto-2">{subtitulo}</span>
        </Link>
      </div>
    </header>
  );
}
