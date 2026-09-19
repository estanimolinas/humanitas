import Link from "next/link";

/** Una dirección que no existe (o un link viejo). En castellano y sin culpas. */
export default function NoEncontrada() {
  return (
    <main className="contenedor flex flex-1 flex-col gap-4">
      <h1 className="titulo">No encontramos esta página</h1>
      <p className="text-texto-2">Puede que el link esté incompleto o que la página ya no exista.</p>
      <Link href="/" className="boton-principal">
        Ir al inicio
      </Link>
    </main>
  );
}
