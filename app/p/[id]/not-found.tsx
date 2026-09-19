import Link from "next/link";

/** Publicación cerrada, vencida, en revisión o inexistente: para quien mira, es lo mismo. */
export default function PublicacionNoDisponible() {
  return (
    <main className="contenedor flex flex-1 flex-col gap-4">
      <h1 className="titulo">Esta publicación ya no está disponible</h1>
      <p className="text-texto-2">
        Puede que la persona ya haya resuelto lo que buscaba. En el inicio hay otras publicaciones.
      </p>
      <Link href="/" className="boton-principal boton-suelto">
        Ver otras publicaciones
      </Link>
    </main>
  );
}
