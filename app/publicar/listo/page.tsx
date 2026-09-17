import type { Metadata } from "next";
import Link from "next/link";
import { obtenerDetalle } from "@/lib/detalle";

export const metadata: Metadata = { title: "Publicado · Humanitas" };

export default async function PaginaListo({ searchParams }: PageProps<"/publicar/listo">) {
  const id = (await searchParams).id;
  const publicacion = typeof id === "string" ? await obtenerDetalle(id) : null;

  return (
    <main className="contenedor flex flex-1 flex-col gap-4">
      <h1 className="titulo">Tu publicación ya se ve en el barrio</h1>
      {publicacion && <p className="font-semibold">{publicacion.titulo}</p>}
      <p className="text-texto-2">
        Cuando alguien toque Contactar, te va a escribir por WhatsApp. Tu celular no se muestra en
        ninguna pantalla.
      </p>

      {publicacion && (
        <Link href={`/p/${publicacion.id}`} className="boton-principal boton-suelto">
          Ver cómo quedó
        </Link>
      )}
      <Link href="/" className="boton-secundario max-w-[16rem]">
        Volver al listado
      </Link>
      <Link href="/publicar" className="text-texto-2 underline">
        Publicar otra cosa
      </Link>
    </main>
  );
}
