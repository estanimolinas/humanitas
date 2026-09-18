import type { Metadata } from "next";
import { linkEquipo } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Ayuda · Humanitas" };

// Ayuda (decisión 18/09/2026): sin puntos de alta ni instituciones en el medio. Lo que la app
// no resuelve sola lo resuelve el equipo de Humanitas, por WhatsApp.
export default function PaginaAyuda() {
  const link = linkEquipo(process.env.WHATSAPP_EQUIPO);

  return (
    <main className="contenedor flex flex-1 flex-col gap-4">
      <h1 className="titulo">Ayuda</h1>
      <p>
        Si necesitás algo que la app no resuelve, el equipo de Humanitas te ayuda por WhatsApp.
      </p>

      <section className="flex flex-col gap-2 border-t divisor pt-4">
        <h2 className="kicker">Cambiaste de celular</h2>
        <p>Te ayudamos a recuperar tu cuenta y tus publicaciones con el número nuevo.</p>
      </section>

      <section className="flex flex-col gap-2 border-t divisor pt-4">
        <h2 className="kicker">Tus datos</h2>
        <p>
          Podés pedirnos ver los datos que guardamos o darte de baja. Al darte de baja, tu cuenta se
          archiva y tu número se borra (Ley 25.326 de Protección de Datos Personales).
        </p>
      </section>

      {link ? (
        <a href={link} className="boton-principal boton-suelto mt-2">
          Escribir al equipo por WhatsApp
        </a>
      ) : (
        <p className="aviso mt-2">El contacto del equipo va a estar disponible muy pronto.</p>
      )}
    </main>
  );
}
