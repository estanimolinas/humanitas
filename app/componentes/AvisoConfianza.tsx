/** Texto elegido el 18/09/2026. Es el mismo en todas las pantallas: no se reescribe. */
export const TEXTO_CONFIANZA =
  "Humanitas no percibe comisiones ni intermedia pagos. Los acuerdos económicos se establecen directamente entre las partes.";

/** Aviso de confianza: en inicio, junto a Contactar, al publicar y en el alta. */
export function AvisoConfianza() {
  return <p className="aviso text-[15px]">{TEXTO_CONFIANZA}</p>;
}
