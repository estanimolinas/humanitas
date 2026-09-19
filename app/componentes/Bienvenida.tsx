import { cookies } from "next/headers";
import { COOKIE_BIENVENIDA } from "@/lib/sesion/constantes";
import { cerrarBienvenida } from "../acciones-listado";

const PASOS = [
  "Mirás lo que se ofrece y lo que se necesita en la zona norte de la ciudad de Santa Fe.",
  "Si algo te sirve, le escribís a esa persona por WhatsApp.",
  "Acuerdan directamente entre ustedes: el trabajo, el precio y el día.",
];

/** Para quien entra por primera vez: qué es Humanitas y cómo funciona. Se cierra una vez y listo. */
export async function Bienvenida() {
  if ((await cookies()).has(COOKIE_BIENVENIDA)) return null;

  return (
    <section className="aviso flex flex-col gap-3" aria-labelledby="bienvenida">
      <p className="kicker">Te damos la bienvenida</p>
      <h2 id="bienvenida" className="text-[18px] font-semibold leading-snug text-pretty">
        Humanitas acerca a quien ofrece un trabajo y a quien lo necesita.
      </h2>
      <ol className="flex flex-col gap-2">
        {PASOS.map((paso, i) => (
          <li key={paso} className="flex gap-3">
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-dorado-oscuro text-sm font-semibold text-white"
            >
              {i + 1}
            </span>
            <span className="pt-0.5">{paso}</span>
          </li>
        ))}
      </ol>
      <form action={cerrarBienvenida}>
        <button type="submit" className="boton-secundario bg-fondo">
          Entendido
        </button>
      </form>
    </section>
  );
}
