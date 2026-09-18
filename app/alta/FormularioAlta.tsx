"use client";

import { useActionState, useState } from "react";
import { validarAlta, type ErroresAlta } from "@/lib/alta";
import { EJEMPLO_TELEFONO } from "@/lib/telefono";
import type { GrupoZonas } from "@/lib/zonas";
import { ELEGIR_BARRIO } from "@/lib/zonas-config";
import { AvisoConfianza } from "../componentes/AvisoConfianza";
import { darDeAlta, type EstadoAlta } from "./acciones";

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

          <h2 className="titulo">¿Es correcto tu número de WhatsApp?</h2>
          <p>Los mensajes van a llegar a este número:</p>
          <p className="text-3xl font-semibold tracking-wide">{validacion.datos.telefonoLegible}</p>
          <p>A nombre de {validacion.datos.nombre}.</p>

          {estado.mensaje && !estado.errores && (
            <p role="alert" className="aviso-error text-error">
              {estado.mensaje}
            </p>
          )}

          {estado.errores?.telefono && (
            <div role="alert" className="aviso-error">
              <p className="font-semibold text-error">{estado.errores.telefono}</p>
              {estado.mensaje && <p className="mt-1">{estado.mensaje}</p>}
            </div>
          )}

          <button type="submit" className="boton-principal" disabled={enviando}>
            {enviando ? "Creando tu cuenta…" : "Sí, crear mi cuenta"}
          </button>
          <button
            type="button"
            className="boton-secundario"
            onClick={() => setConfirmando(false)}
            disabled={enviando}
          >
            Corregir
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="nombre" className="etiqueta">
              Tu nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              className="campo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="given-name"
              maxLength={80}
              aria-invalid={!!errores.nombre}
              aria-describedby={errores.nombre ? "error-nombre" : undefined}
            />
            {errores.nombre && (
              <p id="error-nombre" className="texto-error">
                {errores.nombre}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="telefono" className="etiqueta">
              Tu celular con WhatsApp
            </label>
            <p id="ayuda-telefono" className="text-texto-2">
              Con característica, por ejemplo {EJEMPLO_TELEFONO}. No se muestra en ninguna pantalla:
              solo lo recibe por WhatsApp quien te quiera contactar y también dejó el suyo.
            </p>
            <input
              id="telefono"
              name="telefono"
              className="campo"
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
              <div id="error-telefono" className="texto-error">
                <p>{errores.telefono}</p>
                {estado.mensaje && <p>{estado.mensaje}</p>}
              </div>
            )}
          </div>

          {ELEGIR_BARRIO && (
            <div className="flex flex-col gap-2">
              <label htmlFor="zonaId" className="etiqueta">
                Tu barrio (si querés)
              </label>
              <select
                id="zonaId"
                name="zonaId"
                className="campo"
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
          )}

          <p className="aviso">
            Guardamos tu nombre y tu celular. Nada más: ni documento, ni mail, ni ubicación.
          </p>

          <div className="flex flex-col gap-3 border-t divisor pt-4">
            <label className="flex min-h-12 items-start gap-3">
              <input
                type="checkbox"
                name="terminos"
                value="si"
                className="check"
                checked={terminos}
                onChange={(e) => setTerminos(e.target.checked)}
              />
              <span>
                Leí y acepto los{" "}
                <a href="/terminos" target="_blank" className="text-dorado-oscuro underline">
                  términos
                </a>
                .
              </span>
            </label>
            {errores.terminos && <p className="texto-error">{errores.terminos}</p>}

            <label className="flex min-h-12 items-start gap-3">
              <input
                type="checkbox"
                name="mayorDeEdad"
                value="si"
                className="check"
                checked={mayorDeEdad}
                onChange={(e) => setMayorDeEdad(e.target.checked)}
              />
              <span>Tengo 18 años o más.</span>
            </label>
            {errores.mayorDeEdad && <p className="texto-error">{errores.mayorDeEdad}</p>}
          </div>

          <AvisoConfianza />

          <button type="submit" className="boton-principal">
            Seguir
          </button>
        </>
      )}
    </form>
  );
}
