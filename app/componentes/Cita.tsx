/**
 * Cita de Magnifica Humanitas, con el estilo del mockup: kicker dorado, cita destacada y
 * número de párrafo. Solo para texto copiado tal cual de la traducción oficial (vatican.va)
 * y verificado; ver docs/guia-visual.md, sección 7.
 */
export function Cita({ texto, numero, tema }: { texto: string; numero: number; tema?: string }) {
  return (
    <figure className="flex flex-col gap-2 border-t divisor pt-5">
      <p className="kicker">{tema ?? "Magnifica Humanitas · León XIV"}</p>
      <blockquote className="text-[18px] font-semibold leading-snug text-pretty">«{texto}»</blockquote>
      <figcaption className="text-sm text-texto-2 tabular-nums">Magnifica Humanitas, n. {numero}</figcaption>
    </figure>
  );
}
