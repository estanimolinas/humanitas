import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Denuncia recibida · Humanitas" };

export default function PaginaDenunciada() {
  return (
    <main className="contenedor flex flex-1 flex-col gap-4">
      <h1 className="titulo">Gracias por avisar</h1>
      <p>
        Una persona del equipo de Humanitas la revisa en menos de 24 horas. Si hay más denuncias, la publicación se oculta
        mientras tanto.
      </p>
      <p className="text-texto-2">
        Si creés que alguien está en peligro, también conviene llamar al 911.
      </p>
      <Link href="/" className="boton-principal boton-suelto">
        Volver al listado
      </Link>
    </main>
  );
}
