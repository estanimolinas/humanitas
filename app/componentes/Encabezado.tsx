import Link from "next/link";

/** Encabezado de todas las pantallas (guía visual, sección 3). */
export function Encabezado({ subtitulo = "Norte de Santa Fe" }: { subtitulo?: string }) {
  return (
    <header className="border-b divisor">
      <div className="mx-auto w-full max-w-md px-5 py-3">
        <Link href="/" className="block">
          <span className="block text-[17px] font-semibold leading-tight">Humanitas</span>
          <span className="mt-px block text-sm text-texto-2">{subtitulo}</span>
        </Link>
      </div>
    </header>
  );
}
