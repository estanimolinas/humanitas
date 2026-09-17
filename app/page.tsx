import Link from "next/link";

// Pantalla provisoria con el estilo de la guía visual. El listado real (7.1) llega en el paso 4.
export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-5">
      <figure className="flex flex-col gap-2">
        <figcaption className="kicker">Magnifica Humanitas · León XIV</figcaption>
        {/* Cita textual de la traducción oficial (vatican.va). */}
        <blockquote className="text-[22px] font-semibold leading-snug">
          «El trabajo no es un simple instrumento, sino que expresa y acrecienta la dignidad de
          nuestra vida.»
        </blockquote>
        <p className="text-sm text-texto-2">Magnifica Humanitas, 149</p>
      </figure>

      <hr className="divisor" />

      <p>
        Humanitas es la app de los vecinos y las vecinas del barrio. Quien tiene trabajo para dar
        publica lo que necesita. Quien quiere trabajar publica lo que sabe hacer o lo que vende. Se
        contactan directo por WhatsApp.
      </p>
      <p className="text-texto-2">
        Humanitas no cobra comisión ni intermedia el dinero. El acuerdo es entre vecinos.
      </p>

      <div className="aviso">
        La lista se está armando. En unos días vas a ver las publicaciones acá.
      </div>

      <Link href="/alta" className="boton-principal">
        Crear mi cuenta
      </Link>

      <Link href="/terminos" className="text-center text-texto-2 underline">
        Términos de uso
      </Link>
    </main>
  );
}
