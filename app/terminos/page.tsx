import type { Metadata } from "next";

export const metadata: Metadata = { title: "Términos · Humanitas" };

// BORRADOR (decisión 14/09/2026): texto provisorio hasta que quien lleva el proyecto pase el
// definitivo, idealmente validado con alguien de derecho (requerimiento 10.6 y 18).
export default function PaginaTerminos() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-5 text-lg">
      <p className="rounded-lg border-2 border-dashed border-zinc-900 p-3 text-center font-bold">
        BORRADOR · texto provisorio
      </p>
      <h1 className="text-2xl font-bold">Términos de uso</h1>

      <h2 className="text-xl font-semibold">Qué es Humanitas</h2>
      <p>
        Un tablón para que vecinos y vecinas se encuentren: quien ofrece un trabajo o un producto y quien
        lo necesita. Humanitas no cobra, no cobra comisión y no interviene en los pagos.
      </p>

      <h2 className="text-xl font-semibold">Qué no es</h2>
      <p>
        Humanitas no es parte del acuerdo entre las personas. No garantiza trabajos ni productos. El precio
        y la forma de pago los arreglan las dos partes entre ellas.
      </p>

      <h2 className="text-xl font-semibold">Qué guardamos y para qué</h2>
      <p>
        Tu nombre, tu celular y tu barrio si lo elegís. Los usamos solo para que puedan contactarte por
        WhatsApp. Tu celular no se muestra en ninguna pantalla: lo recibe, a través del botón de WhatsApp,
        solo quien también dejó el suyo. Queda registrado quién pidió contactar a quién.
      </p>
      <p>No guardamos documento, mail, contraseña, ubicación ni tu historial de navegación.</p>

      <h2 className="text-xl font-semibold">Tus derechos</h2>
      <p>
        Podés pedir ver tus datos o darte de baja en tu punto de alta. Al darte de baja, tu cuenta se
        archiva y tu número se borra de la cuenta (Ley 25.326 de Protección de Datos Personales).
      </p>

      <h2 className="text-xl font-semibold">Mayores de 18</h2>
      <p>Humanitas es solo para personas de 18 años o más.</p>
    </main>
  );
}
