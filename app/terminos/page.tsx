import type { Metadata } from "next";
import { TEXTO_CONFIANZA } from "../componentes/AvisoConfianza";
import { Cita } from "../componentes/Cita";

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
          Una app que acerca a las personas. Quien quiere trabajar publica el oficio que sabe hacer
          o lo que vende. Quien tiene un trabajo para dar publica lo que necesita. Después se
          contactan directamente por WhatsApp y acuerdan entre ellas.
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t divisor pt-4">
        <h2 className="kicker">El papel de Humanitas</h2>
        <p>
          Humanitas es un espacio de encuentro entre personas. Su función es acercar a quien
          ofrece un trabajo o un producto y a quien lo necesita. No funciona como bolsa de trabajo
          ni como agencia de empleo, y no es empleadora. Ninguna institución interviene en los
          acuerdos.
        </p>
        <p>Cada acuerdo queda en manos de las personas que lo hacen. {TEXTO_CONFIANZA}</p>
        <p>
          La calidad de cada trabajo o producto depende de quien lo ofrece. Por eso recomendamos
          conversar con tranquilidad y dejar todo acordado antes de empezar.
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
          solo quien también dejó el suyo. Para cuidar a todas las personas, se registra quién pidió
          contactar a quién.
        </p>
        <p>No guardamos documento, mail, contraseña, ubicación ni tu historial de navegación.</p>
      </section>

      <section className="flex flex-col gap-2 border-t divisor pt-4">
        <h2 className="kicker">Tus derechos</h2>
        <p>
          Podés pedir ver tus datos o darte de baja escribiendo al equipo de Humanitas, desde{" "}
          <a href="/ayuda" className="text-dorado-oscuro underline">
            Ayuda
          </a>
          . Al darte de baja, tu cuenta se archiva y tu número se borra (Ley 25.326 de Protección de
          Datos Personales).
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t divisor pt-4">
        <h2 className="kicker">Mayores de 18</h2>
        <p>Humanitas está pensada para personas de 18 años o más.</p>
      </section>

      <Cita
        numero={68}
        tema="Por qué empieza en el barrio"
        texto="aquello que pueden hacer las personas, las familias, las comunidades locales y los cuerpos intermedios no debe ser absorbido por instancias superiores"
      />
    </main>
  );
}
