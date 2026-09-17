import type { GrupoZonas } from "@/lib/zonas";
import { elegirZona } from "../acciones-listado";

/**
 * Elegir barrio para ordenar el listado. La zona ORDENA, NUNCA FILTRA (8.1): el texto se lo dice
 * a la persona con todas las letras.
 */
export function SelectorZona({
  zonas,
  zonaElegida,
}: {
  zonas: GrupoZonas[];
  zonaElegida: number | null;
}) {
  return (
    <form action={elegirZona} className="flex flex-col gap-2">
      <label htmlFor="zona-orden" className="etiqueta">
        Tu barrio
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          id="zona-orden"
          name="zonaId"
          defaultValue={zonaElegida ? String(zonaElegida) : ""}
          className="campo max-w-[18rem]"
        >
          <option value="">Todos los barrios</option>
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
        <button type="submit" className="boton-secundario max-w-[10rem]">
          Ordenar
        </button>
      </div>
      <p className="text-sm text-texto-2">
        Primero lo de tu barrio. Lo demás sigue apareciendo.
      </p>
    </form>
  );
}
