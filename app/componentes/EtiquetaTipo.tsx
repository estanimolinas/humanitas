import type { Tipo } from "@/lib/publicaciones-tipos";

/** Etiqueta con borde: OFREZCO en dorado, NECESITO en gris (mockup, listado y detalle). */
export function EtiquetaTipo({ tipo }: { tipo: Tipo }) {
  const esOfrezco = tipo === "ofrezco";
  return (
    <span
      className={`inline-block shrink-0 rounded border px-1.5 py-0.5 text-xs font-semibold tracking-wide ${
        esOfrezco ? "border-dorado text-dorado-oscuro" : "border-borde-campo text-texto-2"
      }`}
    >
      {esOfrezco ? "Ofrezco" : "Necesito"}
    </span>
  );
}
