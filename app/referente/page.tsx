import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { buscarPorTelefono, referenteDe } from "@/lib/referente";
import { personaActual } from "@/lib/sesion/actual";
import { EJEMPLO_TELEFONO } from "@/lib/telefono";
import { buscar, verificar } from "./acciones";

export const metadata: Metadata = { title: "Verificar vecinos · Humanitas" };

// Verificación presencial (R14, E2). La hace un referente activo, con la persona delante.
export default async function PaginaReferente({ searchParams }: PageProps<"/referente">) {
  const persona = await personaActual();
  if (!persona) redirect("/alta?volver=%2Freferente");

  const referente = await referenteDe(persona.id);
  // Si no sos referente activo, esta pantalla no existe.
  if (!referente) notFound();

  const q = await searchParams;
  const telefono = typeof q.telefono === "string" ? q.telefono : null;
  const encontrada = telefono ? await buscarPorTelefono(telefono) : null;

  return (
    <main className="contenedor flex flex-1 flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="titulo">Verificar vecinos</h1>
        <p className="text-texto-2">Estás verificando en {referente.lugar}.</p>
      </div>

      {typeof q.listo === "string" && <p className="aviso">Listo. Quedó verificada en {q.listo}.</p>}
      {typeof q.error === "string" && (
        <p className="aviso-error text-error" role="alert">
          {q.error === "no_existe"
            ? "No encontramos esa cuenta. Que se dé de alta primero desde su celular."
            : q.error}
        </p>
      )}

      <form action={buscar} className="flex flex-col gap-2">
        <label htmlFor="telefono" className="etiqueta">
          Celular de la persona
        </label>
        <p className="text-texto-2">Se lo pedís a la persona que tenés adelante.</p>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          inputMode="tel"
          className="campo"
          placeholder={EJEMPLO_TELEFONO}
          defaultValue=""
        />
        <button type="submit" className="boton-secundario max-w-[12rem]">
          Buscar
        </button>
      </form>

      {telefono && !encontrada && (
        <p className="aviso">
          No hay ninguna cuenta con ese número. Que se dé de alta desde su celular y volvés a
          buscar.
        </p>
      )}

      {encontrada && (
        <form action={verificar} className="flex flex-col gap-3 border-t divisor pt-4">
          <input type="hidden" name="personaId" value={encontrada.id} />
          <p className="etiqueta">¿Es esta persona?</p>
          <p className="text-[22px] font-semibold">{encontrada.nombre}</p>
          {encontrada.verificadoLugar ? (
            <p className="text-texto-2">Ya está verificada en {encontrada.verificadoLugar}.</p>
          ) : (
            <p className="text-texto-2">Todavía no está verificada.</p>
          )}
          <button type="submit" className="boton-principal">
            Sí, la verifico en {referente.lugar}
          </button>
        </form>
      )}
    </main>
  );
}
