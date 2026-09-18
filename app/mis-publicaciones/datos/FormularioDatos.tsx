"use client";

import { useState } from "react";
import { normalizarTelefono } from "@/lib/telefono";
import type { GrupoZonas } from "@/lib/zonas";
import { guardarDatos } from "../acciones";

/** Datos de la persona (7.4). El teléfono se cambia con confirmación en pantalla. */
export function FormularioDatos({
  nombreInicial,
  zonaInicial,
  zonas,
  error,
}: {
  nombreInicial: string;
  zonaInicial: number | null;
  zonas: GrupoZonas[];
  error: string | null;
}) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [telefono, setTelefono] = useState("");
  const [zonaId, setZonaId] = useState(zonaInicial ? String(zonaInicial) : "");

  const cambiaTelefono = telefono.trim().length > 0;
  const nuevo = cambiaTelefono ? normalizarTelefono(telefono) : null;

  return (
    <form action={guardarDatos} className="flex flex-col gap-5">
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
          maxLength={80}
        />
        {error === "nombre" && <p className="texto-error">Nos falta tu nombre.</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="telefono" className="etiqueta">
          Cambiar mi celular
        </label>
        <p className="text-texto-2">
          Si no querés cambiarlo, puede quedar vacío. Tu número no se muestra en ninguna pantalla.
        </p>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          inputMode="tel"
          className="campo"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="342 512 3456"
        />
        {nuevo?.ok && (
          <p className="aviso">
            Los mensajes van a llegar a <strong>{nuevo.legible}</strong>.
          </p>
        )}
        {nuevo && !nuevo.ok && <p className="texto-error">{nuevo.error}</p>}
        {error === "telefono" && <p className="texto-error">Parece que el número tiene un error. ¿Lo revisamos?</p>}
        {error === "telefono_existente" && (
          <p className="texto-error">Ese número ya tiene una cuenta en Humanitas.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="zonaId" className="etiqueta">
          Mi barrio
        </label>
        <select
          id="zonaId"
          name="zonaId"
          className="campo"
          value={zonaId}
          onChange={(e) => setZonaId(e.target.value)}
        >
          <option value="">Prefiero no decirlo</option>
          {zonas.map((g) => (
            <optgroup key={g.localidad} label={g.localidad}>
              {g.barrios.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <button type="submit" className="boton-principal" disabled={cambiaTelefono && !nuevo?.ok}>
        Guardar
      </button>
    </form>
  );
}
