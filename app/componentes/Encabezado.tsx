import Link from "next/link";
import { personaActual } from "@/lib/sesion/actual";
import { Iniciales } from "./Iniciales";
import { Simbolo } from "./Oficio";

/** Encabezado de todas las pantallas (guía visual, sección 3). Con sesión, las iniciales llevan al perfil. */
export async function Encabezado({ subtitulo = "Tecnología al servicio de la humanidad" }: { subtitulo?: string }) {
  const persona = await personaActual();
  return (
    <header className="encabezado">
      <div className="mx-auto flex w-full max-w-[var(--ancho-pagina)] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Simbolo className="size-8 text-dorado-oscuro" />
          <span className="min-w-0">
            <span className="block text-[17px] font-semibold leading-tight sm:text-xl">Humanitas</span>
            <span className="mt-px block text-[11px] text-texto-2 min-[380px]:text-[12px] sm:text-sm">{subtitulo}</span>
          </span>
        </Link>
        {persona && (
          <Link href="/mis-publicaciones" aria-label="Mis publicaciones y mis datos">
            <Iniciales nombre={persona.nombre} />
          </Link>
        )}
      </div>
    </header>
  );
}
