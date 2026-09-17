import type { Metadata } from "next";

export const metadata: Metadata = { title: "Términos · Humanitas" };

// BORRADOR (decisión 14/09/2026): texto provisorio hasta que quien lleva el proyecto pase el
// definitivo, idealmente validado con alguien de derecho (requerimiento 10.6 y 18).
export default function PaginaTerminos() {
  return (
    <main className="contenedor flex flex-1 flex-col gap-4">
      <p className="aviso text-center font-semibold">BORRADOR · texto provisorio</p>

      <h1 className="titulo">Términos de uso</h1>

      <section className="flex flex-col gap-2 border-t divisor pt-4">
        <h2 className="kicker">Qué es Humanitas</h2>
        <p>
          Una app para los vecinos y las vecinas del barrio. Quien quiere trabajar publica el oficio
          que sabe hacer o lo que vende. Quien tiene un trabajo para dar publica lo que necesita.
          Después se contactan directo por WhatsApp y arreglan entre ellos.
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t divisor pt-4">
        <h2 className="kicker">Qué no es</h2>
        <p>
          Humanitas no es una bolsa de trabajo ni una agencia de empleo: no consigue trabajo, no
          contrata a nadie y no es empleadora.
        </p>
        <p>
          Tampoco es parte del acuerdo entre las personas. No cobra, no cobra comisión y no
          interviene en los pagos. No garantiza los trabajos ni los productos publicados. El precio
          y la forma de pago los arreglan las dos partes entre ellas.
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t divisor pt-4">
        <h2 className="kicker">Qué guardamos y para qué</h2>
        <p>
          Tu nombre, tu celular y tu barrio si lo elegís. Los usamos solo para que puedan
          contactarte por WhatsApp.
        </p>
        <p>
          Tu celular no se muestra en ninguna pantalla: lo recibe, a través del botón de WhatsApp,
          solo quien también dejó el suyo. Queda registrado quién pidió contactar a quién.
        </p>
        <p>No guardamos documento, mail, contraseña, ubicación ni tu historial de navegación.</p>
      </section>

      <section className="flex flex-col gap-2 border-t divisor pt-4">
        <h2 className="kicker">Tus derechos</h2>
        <p>
          Podés pedir ver tus datos o darte de baja en tu punto de alta. Al darte de baja, tu cuenta
          se archiva y tu número se borra de la cuenta (Ley 25.326 de Protección de Datos
          Personales).
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t divisor pt-4">
        <h2 className="kicker">Mayores de 18</h2>
        <p>Humanitas es solo para personas de 18 años o más.</p>
      </section>
    </main>
  );
}
