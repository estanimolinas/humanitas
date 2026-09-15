// Pantalla provisoria: el listado real (7.1) se construye en el paso 4.
export default function Inicio() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-3xl font-bold">Humanitas</h1>
      {/* Cita textual de la traducción oficial (vatican.va). */}
      <figure className="max-w-md">
        <blockquote className="text-lg italic">
          “El trabajo no es un simple instrumento, sino que expresa y acrecienta la dignidad de
          nuestra vida.”
        </blockquote>
        <figcaption className="mt-1 text-sm">León XIV, Magnifica Humanitas, 149</figcaption>
      </figure>
    </main>
  );
}
