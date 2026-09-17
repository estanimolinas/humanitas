import type postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { antiguedad } from "@/lib/tiempo";
import { conectar, enTransaccion } from "./db";

const sql = conectar();
afterAll(() => sql.end());

type Fila = { id: string; titulo: string; zona: string | null; rubro: string };

/** Llama a la misma función SQL que usa la app. */
function listar(
  tx: postgres.TransactionSql,
  opciones: {
    tipo?: string;
    subtipo?: string | null;
    rubroId?: number | null;
    zonaId?: number | null;
    limite?: number;
    excluir?: string[];
  } = {},
) {
  return tx<Fila[]>`
    select * from listar_publicaciones(
      ${opciones.tipo ?? "ofrezco"},
      ${opciones.subtipo ?? null},
      ${opciones.rubroId ?? null},
      ${opciones.zonaId ?? null},
      ${opciones.limite ?? 10},
      ${opciones.excluir ?? []}::uuid[]
    )`;
}

async function persona(tx: postgres.TransactionSql, nombre: string, zonaId: number | null = null) {
  const [p] = await tx`
    insert into personas (nombre, telefono, token_hash, terminos_aceptados_en, mayoria_edad_declarada, zona_id)
    values (${nombre}, ${"549342" + Math.floor(Math.random() * 1e7).toString().padStart(7, "0")},
            ${"h-" + nombre + Math.random()}, now(), true, ${zonaId})
    returning id`;
  return p.id as string;
}

/** Rubro exclusivo del test, para no mezclarse con las publicaciones del seed local. */
async function rubro(tx: postgres.TransactionSql, familia = "servicio") {
  const [r] = await tx`
    insert into rubros (nombre, familia, orden)
    values (${"Rubro de prueba " + Math.random()}, ${familia}, 90)
    returning id`;
  return r.id as number;
}

async function barrios(tx: postgres.TransactionSql) {
  const filas = await tx`
    select z.id, z.nombre, z.parent_id from zonas z where z.tipo = 'barrio' order by z.nombre limit 3`;
  return filas as unknown as { id: number; nombre: string; parent_id: number }[];
}

async function publicar(
  tx: postgres.TransactionSql,
  datos: {
    personaId: string;
    rubroId: number;
    titulo: string;
    tipo?: string;
    subtipo?: string | null;
    zonaId?: number | null;
    estado?: string;
    venceEn?: string | null;
    creadaEn?: string | null;
  },
) {
  const [p] = await tx`
    insert into publicaciones (persona_id, tipo, subtipo, rubro_id, titulo, zona_id, estado, vence_en, creada_en)
    values (
      ${datos.personaId},
      ${datos.tipo ?? "ofrezco"},
      ${datos.subtipo === undefined ? "servicio" : datos.subtipo},
      ${datos.rubroId}, ${datos.titulo}, ${datos.zonaId ?? null},
      ${datos.estado ?? "activa"}, ${datos.venceEn ?? null},
      ${datos.creadaEn ?? new Date().toISOString()}
    ) returning id`;
  return p.id as string;
}

describe("R08 / 8.2: rotación por exposición", () => {
  it("con 50 activas y 10 consultas de 10, todas aparecieron en las primeras 10 posiciones", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx, "Rotación");
      const r = await rubro(tx);
      const creadas: string[] = [];
      for (let i = 0; i < 50; i++) {
        creadas.push(await publicar(tx, { personaId: p, rubroId: r, titulo: `Pub ${i}` }));
      }

      const vistas = new Set<string>();
      for (let pagina = 0; pagina < 10; pagina++) {
        const filas = await listar(tx, { rubroId: r, limite: 10 });
        expect(filas).toHaveLength(10);
        filas.forEach((f) => vistas.add(f.id));
      }
      expect(vistas.size).toBe(50);
      expect(creadas.every((id) => vistas.has(id))).toBe(true);
    });
  });

  it("lo servido pasa al final de la rotación: la página siguiente trae otras", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx, "Rotación 2");
      const r = await rubro(tx);
      for (let i = 0; i < 20; i++) {
        await publicar(tx, { personaId: p, rubroId: r, titulo: `P${i}` });
      }
      const primera = await listar(tx, { rubroId: r });
      const segunda = await listar(tx, { rubroId: r });
      const idsPrimera = new Set(primera.map((f) => f.id));
      expect(segunda.some((f) => idsPrimera.has(f.id))).toBe(false);
    });
  });

  it("empate de exposición: primero la más reciente", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx, "Empate");
      const r = await rubro(tx);
      await publicar(tx, {
        personaId: p,
        rubroId: r,
        titulo: "Vieja",
        creadaEn: new Date(Date.now() - 86400000).toISOString(),
      });
      await publicar(tx, { personaId: p, rubroId: r, titulo: "Nueva" });
      const filas = await listar(tx, { rubroId: r });
      expect(filas.map((f) => f.titulo)).toEqual(["Nueva", "Vieja"]);
    });
  });

  it('"Ver más" no repite lo ya mostrado', async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx, "Ver más");
      const r = await rubro(tx);
      for (let i = 0; i < 5; i++) {
        await publicar(tx, { personaId: p, rubroId: r, titulo: `V${i}` });
      }
      const primera = await listar(tx, { rubroId: r, limite: 3 });
      const resto = await listar(tx, { rubroId: r, limite: 3, excluir: primera.map((f) => f.id) });
      expect(resto.map((f) => f.id)).not.toContain(primera[0].id);
      expect(resto).toHaveLength(2);
    });
  });
});

describe("R07 / 8.1: la zona ordena, nunca filtra", () => {
  it("una publicación sin zona aparece con cualquier zona elegida", async () => {
    await enTransaccion(sql, async (tx) => {
      const [b1, b2] = await barrios(tx);
      const p = await persona(tx, "Sin zona");
      const r = await rubro(tx);
      const sinZona = await publicar(tx, { personaId: p, rubroId: r, titulo: "Sin zona", zonaId: null });

      for (const zonaId of [null, b1.id, b2.id]) {
        const filas = await listar(tx, { rubroId: r, zonaId });
        expect(filas.map((f) => f.id), `zona ${zonaId}`).toContain(sinZona);
      }
    });
  });

  it("cambiar de barrio no cambia la cantidad de resultados, solo el orden", async () => {
    await enTransaccion(sql, async (tx) => {
      const [b1, b2] = await barrios(tx);
      const p = await persona(tx, "Zonas");
      const r = await rubro(tx);
      await publicar(tx, { personaId: p, rubroId: r, titulo: "De b1", zonaId: b1.id });
      await publicar(tx, { personaId: p, rubroId: r, titulo: "De b2", zonaId: b2.id });
      await publicar(tx, { personaId: p, rubroId: r, titulo: "Sin barrio", zonaId: null });

      const conB1 = await listar(tx, { rubroId: r, zonaId: b1.id });
      expect(conB1).toHaveLength(3);
      expect(conB1[0].titulo).toBe("De b1");

      const conB2 = await listar(tx, { rubroId: r, zonaId: b2.id });
      expect(conB2).toHaveLength(3);
      expect(conB2[0].titulo).toBe("De b2");
    });
  });

  it("orden por zona: mismo barrio, después la misma localidad, después el resto", async () => {
    await enTransaccion(sql, async (tx) => {
      const [b1, b2] = await barrios(tx);
      // b1 y b2 cuelgan de la misma localidad; creamos una localidad aparte para el "resto".
      const [otra] = await tx`
        insert into zonas (nombre, tipo) values ('Otra localidad', 'localidad') returning id`;
      const [barrioLejano] = await tx`
        insert into zonas (nombre, tipo, parent_id) values ('Barrio lejano', 'barrio', ${otra.id}) returning id`;

      const p = await persona(tx, "Orden zona");
      const r = await rubro(tx);
      await publicar(tx, { personaId: p, rubroId: r, titulo: "Lejano", zonaId: barrioLejano.id });
      await publicar(tx, { personaId: p, rubroId: r, titulo: "Vecino", zonaId: b2.id });
      await publicar(tx, { personaId: p, rubroId: r, titulo: "Mi barrio", zonaId: b1.id });

      const filas = await listar(tx, { rubroId: r, zonaId: b1.id });
      expect(filas.map((f) => f.titulo)).toEqual(["Mi barrio", "Vecino", "Lejano"]);
    });
  });
});

describe("filtros del listado (7.1)", () => {
  it("separa Necesitan de Ofrecen y filtra por subtipo y rubro", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx, "Filtros");
      const servicio = await rubro(tx, "servicio");
      const producto = await rubro(tx, "producto");
      await publicar(tx, { personaId: p, rubroId: servicio, titulo: "Ofrezco servicio" });
      await publicar(tx, {
        personaId: p,
        rubroId: producto,
        titulo: "Ofrezco producto",
        subtipo: "producto",
      });
      await publicar(tx, {
        personaId: p,
        rubroId: servicio,
        titulo: "Necesito algo",
        tipo: "necesito",
        subtipo: null,
      });

      // En "Ofrecen" aparece lo que se ofrece de ese rubro, y no el pedido del mismo rubro.
      const ofrecenServicio = await listar(tx, { tipo: "ofrezco", rubroId: servicio });
      expect(ofrecenServicio.map((f) => f.titulo)).toEqual(["Ofrezco servicio"]);

      const necesitan = await listar(tx, { tipo: "necesito", rubroId: servicio });
      expect(necesitan.map((f) => f.titulo)).toEqual(["Necesito algo"]);

      const ofrecenProducto = await listar(tx, { tipo: "ofrezco", rubroId: producto });
      expect(ofrecenProducto.map((f) => f.titulo)).toEqual(["Ofrezco producto"]);

      // El filtro Servicios / Productos separa bien.
      const soloProductos = await listar(tx, {
        tipo: "ofrezco",
        subtipo: "producto",
        rubroId: producto,
      });
      expect(soloProductos.map((f) => f.titulo)).toEqual(["Ofrezco producto"]);

      const productosEnRubroDeServicio = await listar(tx, {
        tipo: "ofrezco",
        subtipo: "producto",
        rubroId: servicio,
      });
      expect(productosEnRubroDeServicio).toHaveLength(0);
    });
  });

  it("no muestra cerradas, en revisión, archivadas ni vencidas (5.2, 8.5, 8.6)", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx, "Estados");
      const r = await rubro(tx);
      const activa = await publicar(tx, { personaId: p, rubroId: r, titulo: "Activa" });
      await publicar(tx, { personaId: p, rubroId: r, titulo: "Cerrada", estado: "cerrada" });
      await publicar(tx, { personaId: p, rubroId: r, titulo: "En revisión", estado: "en_revision" });
      await publicar(tx, { personaId: p, rubroId: r, titulo: "Archivada", estado: "archivada" });
      await publicar(tx, {
        personaId: p,
        rubroId: r,
        titulo: "Vencida",
        venceEn: new Date(Date.now() - 86400000).toISOString(),
      });
      const archivadaLogica = await publicar(tx, { personaId: p, rubroId: r, titulo: "Con archivado_en" });
      await tx`update publicaciones set archivado_en = now() where id = ${archivadaLogica}`;

      const filas = await listar(tx, { rubroId: r });
      expect(filas.map((f) => f.id)).toEqual([activa]);
    });
  });
});

describe("datos que muestra la fila (7.1, 8.4)", () => {
  it("trae rubro, zona, nombre de pila, verificación y contador de concretados", async () => {
    await enTransaccion(sql, async (tx) => {
      const [b1] = await barrios(tx);
      const quienOfrece = await persona(tx, "Ofrece", b1.id);
      const quienPide = await persona(tx, "Pide", b1.id);
      const r = await rubro(tx);

      const [ref] = await tx`
        insert into referentes (persona_id, lugar) values (${quienOfrece}, 'Vecinal de prueba') returning id`;
      await tx`
        update personas set verificado_por_referente_id = ${ref.id}, verificado_en = now(),
          verificado_lugar = 'Vecinal de prueba' where id = ${quienOfrece}`;

      await publicar(tx, { personaId: quienOfrece, rubroId: r, titulo: "Con datos", zonaId: b1.id });

      const necesito = await publicar(tx, {
        personaId: quienPide,
        rubroId: r,
        titulo: "Pedido cerrado",
        tipo: "necesito",
        subtipo: null,
      });
      await tx`
        insert into concretados (publicacion_necesito_id, persona_que_hizo_id, confirmado_por_persona_id)
        values (${necesito}, ${quienOfrece}, ${quienPide})`;

      const [fila] = await listar(tx, { rubroId: r, tipo: "ofrezco" });
      expect(fila).toMatchObject({
        titulo: "Con datos",
        zona: b1.nombre,
        persona_nombre: "Ofrece",
        verificado_lugar: "Vecinal de prueba",
        concretados: 1,
      });
    });
  });

  it("R05: el listado no devuelve ningún teléfono", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx, "Sin teléfono visible");
      const r = await rubro(tx);
      await publicar(tx, { personaId: p, rubroId: r, titulo: "Pub" });
      const [{ telefono }] = await tx`select telefono from personas where id = ${p}`;
      const filas = await listar(tx, { rubroId: r });
      expect(JSON.stringify(filas)).not.toContain(telefono);
      expect(Object.keys(filas[0])).not.toContain("telefono");
    });
  });
});

describe("antigüedad en lenguaje simple", () => {
  const ahora = new Date("2026-09-17T12:00:00Z");
  it.each([
    ["2026-09-17T11:58:00Z", "recién"],
    ["2026-09-17T11:30:00Z", "hace 30 minutos"],
    ["2026-09-17T11:00:00Z", "hace 1 hora"],
    ["2026-09-17T07:00:00Z", "hace 5 horas"],
    ["2026-09-16T12:00:00Z", "hace 1 día"],
    ["2026-09-15T12:00:00Z", "hace 2 días"],
    ["2026-08-01T12:00:00Z", "hace 1 mes"],
  ])("%s → %s", (fecha, esperado) => {
    expect(antiguedad(fecha, ahora)).toBe(esperado);
  });
});
