import type { Metadata } from "next";
import Link from "next/link";
import { obtenerDetalle } from "@/lib/detalle";
import { Cita } from "../../componentes/Cita";

export const metadata: Metadata = { title: "Publicado · Humanitas" };

export default async function PaginaListo({ searchParams }: PageProps<"/publicar/listo">) {
  const q = await searchParams;
  const id = q.id;
  const publicacion = typeof id === "string" ? await obtenerDetalle(id) : null;

  return (
    <main className="contenedor flex flex-1 flex-col gap-4">
      <h1 className="titulo">Tu publicación ya está visible</h1>
      {publicacion && <p className="font-semibold">{publicacion.titulo}</p>}
      {q.foto === "error" && (
        <p className="aviso">No pudimos subir la foto, pero la publicación ya se ve sin ella.</p>
      )}
      <p className="text-texto-2">
        Cuando alguien toque Contactar, te va a escribir por WhatsApp. Tu celular no se muestra en
        ninguna pantalla.
      </p>

      {publicacion && (
        <Link href={`/p/${publicacion.id}`} className="boton-principal">
          Ver cómo quedó
        </Link>
      )}
      <Link href="/" className="boton-secundario">
        Volver al listado
      </Link>
      <Link href="/publicar" className="text-texto-2 underline">
        Publicar otra cosa
      </Link>

      <Cita
        numero={149}
        tema="Sobre el trabajo"
        texto="el objetivo es ofrecer a cada persona las condiciones para vivir dignamente a través de su propio trabajo"
      />
    </main>
  );
}
