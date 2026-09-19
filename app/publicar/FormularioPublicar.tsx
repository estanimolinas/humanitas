"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { validarAlta, type ErroresAlta } from "@/lib/alta";
import { comprimirFoto } from "@/lib/comprimir-foto";
import { EJEMPLO_TELEFONO } from "@/lib/telefono";
import type { GrupoZonas } from "@/lib/zonas";
import { ELEGIR_BARRIO } from "@/lib/zonas-config";
import type { Rubro } from "@/lib/rubros";
import {
  camposVacios,
  validarPaso1,
  validarPaso2,
  validarPaso3,
  MAX_DESCRIPCION,
  MAX_TITULO,
  type CamposPublicacion,
  type ErroresPublicacion,
} from "@/lib/validar-publicacion";
import { AvisoConfianza } from "../componentes/AvisoConfianza";
import { publicar, type EstadoPublicar } from "./acciones";

const BORRADOR = "humanitas_borrador_publicar";

const chip = (activo: boolean) =>
  `flex min-h-11 items-center rounded-full border px-3 text-sm ${
    activo ? "border-dorado bg-dorado-claro text-dorado-profundo" : "border-borde-campo text-texto-2"
  }`;

/** Una opción grande, con una línea que explica qué significa (paso 1). */
function Opcion({
  activa,
  titulo,
  detalle,
  onClick,
}: {
  activa: boolean;
  titulo: string;
  detalle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-[10px] border px-4 py-3 text-left ${
        activa ? "border-dorado bg-dorado-claro" : "border-borde-campo"
      }`}
    >
      <span
        aria-hidden
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
          activa ? "border-dorado-oscuro bg-dorado-oscuro text-white" : "border-borde-campo"
        }`}
      >
        {activa ? "✓" : ""}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className={`text-[17px] font-semibold ${activa ? "text-dorado-profundo" : ""}`}>{titulo}</span>
        <span className="text-texto-2">{detalle}</span>
      </span>
    </button>
  );
}

export function FormularioPublicar({
  rubros,
  zonas,
  tieneCuenta,
  nombrePersona,
}: {
  rubros: Rubro[];
  zonas: GrupoZonas[];
  tieneCuenta: boolean;
  nombrePersona: string | null;
}) {
  const [estado, accion, enviando] = useActionState<EstadoPublicar, FormData>(publicar, {});

  // Los pasos que se muestran: "¿Dónde?" solo si se eligen barrios; el alta solo si no tiene cuenta.
  const pasos = [
    "que",
    "detalles",
    ...(ELEGIR_BARRIO ? ["donde"] : []),
    ...(tieneCuenta ? [] : ["alta"]),
  ];
  const total = pasos.length;
  const [paso, setPaso] = useState(1);
  const actual = pasos[paso - 1];
  const [c, setC] = useState<CamposPublicacion>(camposVacios);
  const [errores, setErrores] = useState<ErroresPublicacion>({});
  const [erroresAlta, setErroresAlta] = useState<ErroresAlta>({});

  // Alta mínima (solo si no tiene cuenta): aparece al final y no pierde lo escrito (B4).
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [terminos, setTerminos] = useState(false);
  const [mayorDeEdad, setMayorDeEdad] = useState(false);

  const [buscarBarrio, setBuscarBarrio] = useState("");
  const [otroBarrio, setOtroBarrio] = useState(false);
  const [foto, setFoto] = useState<{ nombre: string; kb: number; url: string } | null>(null);
  const [fotoError, setFotoError] = useState<string | null>(null);
  const [comprimiendo, setComprimiendo] = useState(false);
  const entradaFoto = useRef<HTMLInputElement>(null);
  const elegirFotoRef = useRef<HTMLInputElement>(null);

  // Si la persona recarga o se le cierra el navegador, lo escrito sigue guardado en el celular.
  useEffect(() => {
    sessionStorage.setItem(BORRADOR, JSON.stringify({ paso, campos: c }));
  }, [paso, c]);

  // Se lee sin efectos (así no hay renders en cascada) y se restaura con un botón.
  const borradorGuardado = useSyncExternalStore(
    () => () => {},
    () => sessionStorage.getItem(BORRADOR),
    () => null,
  );
  const [borradorDescartado, setBorradorDescartado] = useState(false);
  let borrador: { paso: number; campos: CamposPublicacion } | null = null;
  if (borradorGuardado && !borradorDescartado) {
    try {
      const d = JSON.parse(borradorGuardado) as { paso: number; campos: CamposPublicacion };
      if (d.campos?.titulo || d.campos?.tipo) borrador = d;
    } catch {
      borrador = null;
    }
  }
  const hayBorrador = borrador !== null && paso === 1 && c.tipo === "" && c.titulo === "";

  function seguirBorrador() {
    if (!borrador) return;
    setC({ ...camposVacios, ...borrador.campos });
    setPaso(Math.min(Math.max(borrador.paso, 1), total));
    setBorradorDescartado(true);
  }

  const pone = (clave: keyof CamposPublicacion) => (valor: string) =>
    setC((previo) => ({ ...previo, [clave]: valor }));

  const rubroElegido = rubros.find((r) => String(r.id) === c.rubroId);
  const rubroEsOtros = rubroElegido?.nombre === "Otros";
  // En "Ofrezco" se ven los rubros de lo elegido; en "Necesito", todos, separados en dos grupos
  // (así "Otros" no aparece dos veces sin explicación).
  const gruposRubros =
    c.tipo === "ofrezco" && c.subtipo
      ? [{ titulo: null, rubros: rubros.filter((r) => r.familia === c.subtipo) }]
      : [
          { titulo: "Servicios", rubros: rubros.filter((r) => r.familia === "servicio") },
          { titulo: "Productos", rubros: rubros.filter((r) => r.familia === "producto") },
        ];

  const barriosFiltrados = zonas.flatMap((g) =>
    g.barrios
      .filter((b) => b.nombre.toLowerCase().includes(buscarBarrio.trim().toLowerCase()))
      .map((b) => ({ ...b, localidad: g.localidad })),
  );

  // El barrio de la persona es el mismo que eligió para la publicación: no se pregunta dos veces.
  const altaValida = validarAlta({ nombre, telefono, zonaId: c.zonaId, terminos, mayorDeEdad });

  function siguiente() {
    const e =
      actual === "que"
        ? validarPaso1(c)
        : actual === "detalles"
          ? validarPaso2(c, rubroEsOtros)
          : actual === "donde"
            ? validarPaso3(c)
            : {};
    setErrores(e);
    if (Object.keys(e).length === 0) setPaso(paso + 1);
  }

  async function elegirFoto(archivo: File | undefined) {
    if (!archivo) return;
    setFotoError(null);
    setComprimiendo(true);
    try {
      const comprimida = await comprimirFoto(archivo);
      // La foto que se sube es la comprimida, no la original (R03).
      const dt = new DataTransfer();
      dt.items.add(comprimida);
      if (entradaFoto.current) entradaFoto.current.files = dt.files;
      setFoto({
        nombre: archivo.name,
        kb: Math.round(comprimida.size / 1024),
        url: URL.createObjectURL(comprimida),
      });
    } catch (e) {
      setFotoError(e instanceof Error ? e.message : "No pudimos preparar la foto.");
    } finally {
      setComprimiendo(false);
    }
  }

  function quitarFoto() {
    if (foto) URL.revokeObjectURL(foto.url);
    setFoto(null);
    setFotoError(null);
    if (entradaFoto.current) entradaFoto.current.value = "";
    if (elegirFotoRef.current) elegirFotoRef.current.value = "";
  }

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    // El último paso es el único que manda al servidor.
    if (paso < total) {
      e.preventDefault();
      siguiente();
      return;
    }
    if (!tieneCuenta && !altaValida.ok) {
      e.preventDefault();
      setErroresAlta(altaValida.errores);
    }
  }

  const erroresVisibles: ErroresPublicacion = { ...errores, ...estado.errores };
  const erroresAltaVisibles: ErroresAlta = { ...erroresAlta, ...estado.erroresAlta };

  const error = (clave: keyof CamposPublicacion) =>
    erroresVisibles[clave] ? <p className="texto-error">{erroresVisibles[clave]}</p> : null;

  return (
    <form action={accion} onSubmit={alEnviar} className="flex flex-col gap-5" noValidate>
      {/* Todo lo escrito viaja en el envío final, aunque el paso no esté en pantalla (B4). */}
      <input type="hidden" name="tipo" value={c.tipo} />
      <input type="hidden" name="subtipo" value={c.subtipo} />
      <input type="hidden" name="rubroId" value={c.rubroId} />
      <input type="hidden" name="rubroEsOtros" value={rubroEsOtros ? "si" : "no"} />
      <input type="hidden" name="rubroOtroTexto" value={c.rubroOtroTexto} />
      <input type="hidden" name="titulo" value={c.titulo} />
      <input type="hidden" name="descripcion" value={c.descripcion} />
      <input type="hidden" name="precioTexto" value={c.precioTexto} />
      <input type="hidden" name="aliasPago" value={c.aliasPago} />
      <input type="hidden" name="zonaId" value={c.zonaId} />
      <input type="hidden" name="zonaOtroTexto" value={c.zonaOtroTexto} />
      <input ref={entradaFoto} type="file" name="foto" accept="image/jpeg,image/webp" hidden />

      <p className="etiqueta">Paso {paso} de {total}</p>

      {hayBorrador && (
        <div className="aviso flex flex-col gap-3">
          <p>Hay una publicación sin terminar. ¿Querés seguir con ella?</p>
          <button type="button" className="boton-secundario" onClick={seguirBorrador}>
            Continuar la publicación
          </button>
        </div>
      )}

      {actual === "que" && (
        <section className="flex flex-col gap-4">
          <h2 className="titulo">¿Qué querés hacer?</h2>
          <div className="flex flex-col gap-3">
            <Opcion
              activa={c.tipo === "ofrezco"}
              titulo="Ofrezco algo"
              detalle="Un trabajo que sé hacer o algo que vendo."
              onClick={() => setC({ ...c, tipo: "ofrezco" })}
            />
            <Opcion
              activa={c.tipo === "necesito"}
              titulo="Necesito algo"
              detalle="Alguien que me haga un trabajo o algo que quiero comprar."
              onClick={() => setC({ ...c, tipo: "necesito", subtipo: "" })}
            />
          </div>
          {error("tipo")}

          {c.tipo === "ofrezco" && (
            <>
              <h3 className="etiqueta mt-2">¿Qué ofrecés?</h3>
              <div className="flex flex-col gap-3">
                <Opcion
                  activa={c.subtipo === "servicio"}
                  titulo="Un servicio"
                  detalle="Un trabajo: arreglos, limpieza, cuidado, clases…"
                  onClick={() => setC({ ...c, subtipo: "servicio", rubroId: "" })}
                />
                <Opcion
                  activa={c.subtipo === "producto"}
                  titulo="Un producto"
                  detalle="Algo que hacés o vendés: comida, ropa, artesanías…"
                  onClick={() => setC({ ...c, subtipo: "producto", rubroId: "" })}
                />
              </div>
              {error("subtipo")}
            </>
          )}
        </section>
      )}

      {actual === "detalles" && (
        <section className="flex flex-col gap-5">
          <h2 className="titulo">Los detalles</h2>

          <div className="flex flex-col gap-2">
            <span className="etiqueta">Rubro</span>
            {gruposRubros.map((grupo) => (
              <div key={grupo.titulo ?? "todos"} className="flex flex-col gap-2">
                {grupo.titulo && <p className="mt-1 text-sm font-semibold text-texto-2">{grupo.titulo}</p>}
                <div className="flex flex-wrap gap-2">
                  {grupo.rubros.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={c.rubroId === String(r.id)}
                      className={chip(c.rubroId === String(r.id))}
                      onClick={() => setC({ ...c, rubroId: String(r.id) })}
                    >
                      {r.nombre}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {error("rubroId")}
          </div>

          {rubroEsOtros && (
            <div className="flex flex-col gap-2">
              <label htmlFor="rubroOtroTexto" className="etiqueta">
                ¿De qué se trata?
              </label>
              <input
                id="rubroOtroTexto"
                className="campo"
                value={c.rubroOtroTexto}
                onChange={(e) => pone("rubroOtroTexto")(e.target.value)}
                maxLength={80}
              />
              {error("rubroOtroTexto")}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="titulo" className="etiqueta">
              Título corto
            </label>
            {/* El ejemplo va afuera del campo: en mayúscula, adentro parecería ya escrito. */}
            <p id="ayuda-titulo" className="text-texto-2">
              Por ejemplo: {c.tipo === "necesito" ? "pintor para dos ambientes" : "arreglo de humedad y revoque"}.
            </p>
            <input
              id="titulo"
              className="campo"
              value={c.titulo}
              onChange={(e) => pone("titulo")(e.target.value)}
              maxLength={MAX_TITULO}
              aria-describedby="ayuda-titulo quedan-titulo"
            />
            <p id="quedan-titulo" className="text-sm text-texto-2">
              {MAX_TITULO - c.titulo.length === 1 ? "Te queda 1 letra" : `Te quedan ${MAX_TITULO - c.titulo.length} letras`}
            </p>
            {error("titulo")}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="descripcion" className="etiqueta">
              Detalle (si querés)
            </label>
            <p id="ayuda-descripcion" className="text-texto-2">
              Por ejemplo: qué hacés, cómo cobrás y qué días podés.
            </p>
            <textarea
              id="descripcion"
              className="campo min-h-28 py-3"
              value={c.descripcion}
              onChange={(e) => pone("descripcion")(e.target.value)}
              maxLength={MAX_DESCRIPCION}
              rows={4}
              aria-describedby="ayuda-descripcion"
            />
            {error("descripcion")}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="precioTexto" className="etiqueta">
              Precio (si querés)
            </label>
            <p id="ayuda-precio" className="text-texto-2">Por ejemplo: a convenir, $1500 la docena o por día.</p>
            <input
              id="precioTexto"
              className="campo"
              value={c.precioTexto}
              onChange={(e) => pone("precioTexto")(e.target.value)}
              maxLength={80}
              aria-describedby="ayuda-precio"
            />
            {error("precioTexto")}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="aliasPago" className="etiqueta">
              Alias para que te paguen (si querés)
            </label>
            <input
              id="aliasPago"
              className="campo"
              value={c.aliasPago}
              onChange={(e) => pone("aliasPago")(e.target.value)}
              maxLength={80}
            />
            {error("aliasPago")}
          </div>

          <div className="flex flex-col gap-2">
            <span className="etiqueta">Foto (si querés)</span>
            <p className="text-texto-2">
              Se reduce en tu celular antes de subirla, para cuidar tus datos.
            </p>
            {/* Botón propio: el del navegador dice "Choose file" en inglés. Sin `capture`, el
                celular ofrece sacar una foto o elegir una de la galería. */}
            <input
              ref={elegirFotoRef}
              id="elegir-foto"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => elegirFoto(e.target.files?.[0])}
            />
            {!foto && (
              <label htmlFor="elegir-foto" className="boton-secundario cursor-pointer sm:max-w-[26rem]">
                {comprimiendo ? "Preparando la foto…" : "Agregar una foto"}
              </label>
            )}
            {foto && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- previsualización local */}
                <img src={foto.url} alt="La foto elegida" className="size-20 rounded-lg object-cover" />
                <div className="flex flex-col gap-2">
                  <label htmlFor="elegir-foto" className="cursor-pointer text-dorado-oscuro underline">
                    Cambiar la foto
                  </label>
                  <button type="button" className="text-left text-texto-2 underline" onClick={quitarFoto}>
                    Quitar la foto
                  </button>
                </div>
              </div>
            )}
            {fotoError && <p className="texto-error">{fotoError}</p>}
          </div>
        </section>
      )}

      {actual === "donde" && (
        <section className="flex flex-col gap-4">
          <h2 className="titulo">¿Dónde?</h2>
          <p className="text-texto-2">
            Es opcional. El barrio ordena el listado, pero tu publicación aparece igual en todos.
          </p>

          <input
            className="campo"
            value={buscarBarrio}
            onChange={(e) => setBuscarBarrio(e.target.value)}
            placeholder="Buscar mi barrio"
            aria-label="Buscar mi barrio"
          />

          <div className="flex flex-wrap gap-2">
            {barriosFiltrados.map((b) => (
              <button
                key={b.id}
                type="button"
                className={chip(c.zonaId === String(b.id))}
                onClick={() => {
                  setOtroBarrio(false);
                  setC({ ...c, zonaId: String(b.id), zonaOtroTexto: "" });
                }}
              >
                {b.nombre}
              </button>
            ))}
            <button
              type="button"
              className={chip(otroBarrio)}
              onClick={() => {
                setOtroBarrio(true);
                setC({ ...c, zonaId: "" });
              }}
            >
              Mi zona no está
            </button>
          </div>

          {otroBarrio && (
            <div className="flex flex-col gap-2">
              <label htmlFor="zonaOtroTexto" className="etiqueta">
                ¿Cómo se llama tu zona?
              </label>
              <input
                id="zonaOtroTexto"
                className="campo"
                value={c.zonaOtroTexto}
                onChange={(e) => pone("zonaOtroTexto")(e.target.value)}
                maxLength={80}
              />
            </div>
          )}
          {error("zonaOtroTexto")}
        </section>
      )}

      {actual === "alta" && (
        <section className="flex flex-col gap-5">
          <h2 className="titulo">Últimos datos</h2>
          <p className="text-texto-2">
            Lo que escribiste está guardado. Esto es para que te puedan contactar.
          </p>

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
            {erroresAltaVisibles.nombre && <p className="texto-error">{erroresAltaVisibles.nombre}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="telefono" className="etiqueta">
              Tu celular con WhatsApp
            </label>
            <p className="text-texto-2">
              Con característica, por ejemplo {EJEMPLO_TELEFONO}. No se muestra en ninguna pantalla.
            </p>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              inputMode="tel"
              className="campo"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
            {altaValida.ok && <p className="font-semibold">Te van a escribir a: {altaValida.datos.telefonoLegible}</p>}
            {erroresAltaVisibles.telefono && (
              <div className="texto-error">
                <p>{erroresAltaVisibles.telefono}</p>
                {estado.mensaje && <p>{estado.mensaje}</p>}
              </div>
            )}
          </div>

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
            {erroresAltaVisibles.terminos && <p className="texto-error">{erroresAltaVisibles.terminos}</p>}

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
            {erroresAltaVisibles.mayorDeEdad && <p className="texto-error">{erroresAltaVisibles.mayorDeEdad}</p>}
          </div>
        </section>
      )}

      {paso === total && <AvisoConfianza />}

      {estado.mensaje && !estado.erroresAlta && (
        <p className="aviso-error text-error" role="alert">
          {estado.mensaje}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button type="submit" className="boton-principal" disabled={enviando || comprimiendo}>
          {paso < total
            ? "Seguir"
            : enviando
              ? "Publicando…"
              : tieneCuenta
                ? `Publicar${nombrePersona ? ` como ${nombrePersona}` : ""}`
                : "Publicar"}
        </button>
        {paso > 1 && (
          <button
            type="button"
            className="boton-secundario"
            onClick={() => setPaso(paso - 1)}
            disabled={enviando}
          >
            Volver
          </button>
        )}
      </div>
    </form>
  );
}
