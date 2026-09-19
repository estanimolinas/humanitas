"use client";

import Link from "next/link";

/** Algo falló en el servidor (o se cortó la señal a mitad de camino). Se puede reintentar. */
export default function ErrorGeneral({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="contenedor flex flex-1 flex-col gap-4">
      <h1 className="titulo">Algo no salió bien</h1>
      <p className="text-texto-2">
        Puede ser la señal o un problema nuestro. Podemos intentarlo de nuevo.
      </p>
      <button type="button" className="boton-principal boton-suelto" onClick={() => retry()}>
        Intentar de nuevo
      </button>
      <Link href="/" className="text-dorado-oscuro underline">
        Ir al inicio
      </Link>
    </main>
  );
}
