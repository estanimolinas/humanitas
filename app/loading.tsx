/** Mientras llega la pantalla siguiente: con señal lenta, que se vea que algo está pasando. */
export default function Cargando() {
  return (
    <main className="contenedor flex flex-1 flex-col items-center justify-center gap-3" aria-busy="true">
      <span aria-hidden className="cargando" />
      <p className="text-texto-2" role="status">
        Cargando…
      </p>
    </main>
  );
}
