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
    <form action={elegirZona} className="aviso flex flex-col gap-2">
      <p className="kicker">Cómo se ordena</p>
      <p>Primero lo de tu barrio. Lo demás sigue apareciendo.</p>
      <label htmlFor="zona-orden" className="etiqueta mt-1">
        Tu barrio
      </label>
      <div className="flex items-center gap-2">
        <select
          id="zona-orden"
          name="zonaId"
          defaultValue={zonaElegida ? String(zonaElegida) : ""}
          className="campo min-w-0 flex-1 sm:max-w-[18rem]"
        >
          <option value="">Sin elegir</option>
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
        <button type="submit" className="boton-secundario boton-compacto bg-fondo">
          Ordenar
        </button>
      </div>
    </form>
  );
}
