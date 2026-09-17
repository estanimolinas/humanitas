"use client";

import { useState, useTransition } from "react";
import {
  POR_PAGINA,
  type FiltrosListado,
  type PublicacionListada,
} from "@/lib/publicaciones-tipos";
import { traerMas } from "../acciones-listado";
import { FilaPublicacion } from "./FilaPublicacion";

/** Listado con paginación por botón "Ver más". Sin scroll infinito (regla 8). */
export function ListaPublicaciones({
  inicial,
  filtros,
}: {
  inicial: PublicacionListada[];
  filtros: FiltrosListado;
}) {
  const [publicaciones, setPublicaciones] = useState(inicial);
  const [hayMas, setHayMas] = useState(inicial.length === POR_PAGINA);
  const [enCurso, empezar] = useTransition();

  function verMas() {
    empezar(async () => {
      const nuevas = await traerMas(
        filtros,
        publicaciones.map((p) => p.id),
      );
      setPublicaciones((previas) => {
        const vistas = new Set(previas.map((p) => p.id));
        return [...previas, ...nuevas.filter((p) => !vistas.has(p.id))];
      });
      setHayMas(nuevas.length === POR_PAGINA);
    });
  }

  return (
    <div className="flex flex-col">
      <div className="border-t divisor">
        {publicaciones.map((p) => (
          <FilaPublicacion key={p.id} p={p} />
        ))}
      </div>

      {hayMas && (
        <button type="button" onClick={verMas} className="boton-secundario mt-4" disabled={enCurso}>
          {enCurso ? "Buscando…" : "Ver más"}
        </button>
      )}
    </div>
  );
}
