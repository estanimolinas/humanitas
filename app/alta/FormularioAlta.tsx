"use client";

import { useActionState, useState } from "react";
import { validarAlta, type ErroresAlta } from "@/lib/alta";
import { EJEMPLO_TELEFONO } from "@/lib/telefono";
import type { GrupoZonas } from "@/lib/zonas";
import { darDeAlta, type EstadoAlta } from "./acciones";

// Estilos provisorios: la estética se define en la guía visual antes del paso 4.
const campo = "w-full rounded-lg border border-zinc-400 bg-white px-4 py-3 text-lg";
const botonPrincipal =
  "w-full rounded-lg bg-zinc-900 px-4 py-4 text-lg font-semibold text-white disabled:opacity-60";
const botonSecundario = "w-full rounded-lg border border-zinc-900 px-4 py-4 text-lg font-semibold";

export function FormularioAlta({ zonas, volver }: { zonas: GrupoZonas[]; volver: string }) {
  const [estado, accion, enviando] = useActionState<EstadoAlta, FormData>(darDeAlta, {});

  // Campos controlados: lo escrito nunca se pierde, ni al corregir ni si el servidor devuelve un error.
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [zonaId, setZonaId] = useState("");
  const [terminos, setTerminos] = useState(false);
  const [mayorDeEdad, setMayorDeEdad] = useState(false);
  const [erroresLocales, setErroresLocales] = useState<ErroresAlta>({});
  const [confirmando, setConfirmando] = useState(false);

  const validacion = validarAlta({ nombre, telefono, zonaId, terminos, mayorDeEdad });
  const errores = confirmando ? {} : { ...erroresLocales, ...estado.errores };

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    // Primer toque: se valida y se muestra el número armado para confirmar. Recién el segundo
    // toque manda los datos al servidor.
    if (!confirmando) {
      e.preventDefault();
      if (validacion.ok) {
        setErroresLocales({});
        setConfirmando(true);
      } else {
        setErroresLocales(validacion.errores);
      }
    }
  }

  function corregir() {
    setConfirmando(false);
  }

  return (
    <form action={accion} onSubmit={alEnviar} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="volver" value={volver} />

      {confirmando && validacion.ok ? (
        <>
          <input type="hidden" name="nombre" value={nombre} />
          <input type="hidden" name="telefono" value={telefono} />
          <input type="hidden" name="zonaId" value={zonaId} />
          <input type="hidden" name="terminos" value="si" />
          <input type="hidden" name="mayorDeEdad" value="si" />

          <h2 className="text-2xl font-bold">¿Está bien tu WhatsApp?</h2>
          <p className="text-lg">Te van a escribir a este número:</p>
          <p className="text-3xl font-bold tracking-wide">{validacion.datos.telefonoLegible}</p>
          <p className="text-lg">A nombre de {validacion.datos.nombre}.</p>

          {estado.errores?.telefono && (
            <div role="alert" className="rounded-lg border border-red-700 p-4 text-lg">
              <p className="font-semibold">{estado.errores.telefono}</p>
              {estado.mensaje && <p className="mt-1">{estado.mensaje}</p>}
            </div>
          )}

          <button type="submit" className={botonPrincipal} disabled={enviando}>
            {enviando ? "Creando tu cuenta…" : "Sí, crear mi cuenta"}
          </button>
          <button type="button" className={botonSecundario} onClick={corregir} disabled={enviando}>
            Corregir
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="nombre" className="text-lg font-semibold">
              Tu nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              className={campo}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="given-name"
              maxLength={80}
              aria-invalid={!!errores.nombre}
              aria-describedby={errores.nombre ? "error-nombre" : undefined}
            />
            {errores.nombre && (
              <p id="error-nombre" className="text-red-700">
                {errores.nombre}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="telefono" className="text-lg font-semibold">
              Tu celular con WhatsApp
            </label>
            <p id="ayuda-telefono" className="text-zinc-700">
              Con característica, por ejemplo {EJEMPLO_TELEFONO}. No se muestra en ninguna pantalla:
              solo lo recibe por WhatsApp quien te quiera contactar y también dejó el suyo.
            </p>
            <input
              id="telefono"
              name="telefono"
              className={campo}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={EJEMPLO_TELEFONO}
              aria-invalid={!!errores.telefono}
              aria-describedby={errores.telefono ? "ayuda-telefono error-telefono" : "ayuda-telefono"}
            />
            {errores.telefono && (
              <div id="error-telefono" className="text-red-700">
                <p>{errores.telefono}</p>
                {estado.mensaje && <p>{estado.mensaje}</p>}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="zonaId" className="text-lg font-semibold">
              Tu barrio <span className="font-normal">(si querés)</span>
            </label>
            <select
              id="zonaId"
              name="zonaId"
              className={campo}
              value={zonaId}
              onChange={(e) => setZonaId(e.target.value)}
            >
              <option value="">Prefiero no decirlo</option>
              {zonas.map((grupo) => (
                <optgroup key={grupo.localidad} label={grupo.localidad}>
                  {grupo.barrios.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="rounded-lg bg-zinc-100 p-4 text-zinc-800">
            Guardamos tu nombre, tu celular y tu barrio si lo elegís. Nada más: ni documento, ni mail, ni
            ubicación.
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex min-h-12 items-start gap-3 text-lg">
              <input
                type="checkbox"
                name="terminos"
                value="si"
                className="mt-1 size-6 shrink-0"
                checked={terminos}
                onChange={(e) => setTerminos(e.target.checked)}
              />
              <span>
                Leí y acepto los{" "}
                <a href="/terminos" target="_blank" className="underline">
                  términos
                </a>
                .
              </span>
            </label>
            {errores.terminos && <p className="text-red-700">{errores.terminos}</p>}

            <label className="flex min-h-12 items-start gap-3 text-lg">
              <input
                type="checkbox"
                name="mayorDeEdad"
                value="si"
                className="mt-1 size-6 shrink-0"
                checked={mayorDeEdad}
                onChange={(e) => setMayorDeEdad(e.target.checked)}
              />
              <span>Tengo 18 años o más.</span>
            </label>
            {errores.mayorDeEdad && <p className="text-red-700">{errores.mayorDeEdad}</p>}
          </div>

          <button type="submit" className={botonPrincipal}>
            Seguir
          </button>
        </>
      )}
    </form>
  );
}
