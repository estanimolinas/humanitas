import type postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { dimensionesObjetivo, LADO_MAXIMO } from "@/lib/comprimir-foto";
import {
  MAX_DESCRIPCION,
  MAX_TITULO,
  camposVacios,
  validarPaso1,
  validarPaso2,
  validarPaso3,
  validarPublicacion,
} from "@/lib/validar-publicacion";
import { conectar, enTransaccion } from "./db";

const sql = conectar();
afterAll(() => sql.end());

type FilaCrear = { publicacion_id: string | null; motivo_rechazo: string | null };

async function persona(tx: postgres.TransactionSql) {
  const tel = "549342" + Math.floor(Math.random() * 1e7).toString().padStart(7, "0");
  const [p] = await tx`
    insert into personas (nombre, telefono, token_hash, terminos_aceptados_en, mayoria_edad_declarada)
    values ('Quien publica', ${tel}, ${"h-" + tel}, now(), true) returning id`;
  return p.id as string;
}

async function rubro(tx: postgres.TransactionSql, familia = "servicio") {
  const [r] = await tx`
    insert into rubros (nombre, familia, orden)
    values (${"Rubro " + Math.random()}, ${familia}, 90) returning id`;
  return r.id as number;
}

function crear(
  tx: postgres.TransactionSql,
  personaId: string,
  rubroId: number,
  o: {
    tipo?: string;
    subtipo?: string | null;
    titulo?: string;
    zonaId?: number | null;
    zonaOtro?: string | null;
  } = {},
) {
  return tx<FilaCrear[]>`
    select * from crear_publicacion(
      ${personaId}::uuid,
      ${o.tipo ?? "ofrezco"},
      ${o.subtipo === undefined ? "servicio" : o.subtipo},
      ${rubroId}, null,
      ${o.titulo ?? "Pinto casas"}, null, null, null, null,
      ${o.zonaId ?? null}, ${o.zonaOtro ?? null}
    )`;
}

describe("crear_publicacion: límites de 8.5", () => {
  it("R10: la cuarta publicación del día se rechaza con motivo claro", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx);
      const r = await rubro(tx);
      for (let i = 1; i <= 3; i++) {
        const [fila] = await crear(tx, p, r, { titulo: `Pub ${i}` });
        expect(fila.motivo_rechazo, `publicación ${i}`).toBeNull();
        expect(fila.publicacion_id).toBeTruthy();
      }
      const [cuarta] = await crear(tx, p, r, { titulo: "Cuarta" });
      expect(cuarta).toMatchObject({ publicacion_id: null, motivo_rechazo: "limite_diario" });

      const [{ n }] = await tx`select count(*)::int as n from publicaciones where persona_id = ${p}`;
      expect(n).toBe(3);
    });
  });

  it("con 20 activas no se puede publicar otra", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx);
      const r = await rubro(tx);
      // 20 activas de días anteriores (el límite diario no aplica).
      for (let i = 0; i < 20; i++) {
        await tx`
          insert into publicaciones (persona_id, tipo, subtipo, rubro_id, titulo, creada_en)
          values (${p}, 'ofrezco', 'servicio', ${r}, ${"Vieja " + i}, now() - interval '5 days')`;
      }
      const [fila] = await crear(tx, p, r);
      expect(fila).toMatchObject({ publicacion_id: null, motivo_rechazo: "limite_activas" });
    });
  });

  it("las cerradas no cuentan para el límite de activas", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx);
      const r = await rubro(tx);
      for (let i = 0; i < 20; i++) {
        await tx`
          insert into publicaciones (persona_id, tipo, subtipo, rubro_id, titulo, estado, creada_en)
          values (${p}, 'ofrezco', 'servicio', ${r}, ${"Cerrada " + i}, 'cerrada', now() - interval '5 days')`;
      }
      const [fila] = await crear(tx, p, r);
      expect(fila.motivo_rechazo).toBeNull();
    });
  });
});

describe("crear_publicacion: reglas del contenido", () => {
  it("R02: queda activa, nunca expuesta y visible en el listado", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx);
      const r = await rubro(tx);
      const [fila] = await crear(tx, p, r, { titulo: "Recién publicada" });

      const [pub] = await tx`
        select estado, ultima_exposicion = '-infinity' as nunca_expuesta, foto_url
        from publicaciones where id = ${fila.publicacion_id}`;
      expect(pub).toMatchObject({ estado: "activa", nunca_expuesta: true, foto_url: null });

      const listado = await tx`select id from listar_publicaciones('ofrezco', null, ${r}, null, 10, '{}'::uuid[])`;
      expect(listado.map((f) => f.id)).toContain(fila.publicacion_id);
    });
  });

  it("8.6: vence a los 30 días si es un necesito y a los 90 si es un ofrezco", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx);
      const servicio = await rubro(tx);
      const [ofrezco] = await crear(tx, p, servicio);
      const [necesito] = await crear(tx, p, servicio, { tipo: "necesito", subtipo: null });

      const [dias] = await tx`
        select
          round(extract(epoch from (
            (select vence_en from publicaciones where id = ${ofrezco.publicacion_id}) - now())) / 86400) as ofrezco,
          round(extract(epoch from (
            (select vence_en from publicaciones where id = ${necesito.publicacion_id}) - now())) / 86400) as necesito`;
      expect(Number(dias.ofrezco)).toBe(90);
      expect(Number(dias.necesito)).toBe(30);
    });
  });

  it("el rubro tiene que corresponder al subtipo elegido", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx);
      const deProducto = await rubro(tx, "producto");
      const [mal] = await crear(tx, p, deProducto, { subtipo: "servicio" });
      expect(mal.motivo_rechazo).toBe("rubro_no_corresponde");

      const [bien] = await crear(tx, p, deProducto, { subtipo: "producto" });
      expect(bien.motivo_rechazo).toBeNull();
    });
  });

  it("B5: se puede guardar el barrio escrito a mano, sin barrio de la lista", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx);
      const r = await rubro(tx);
      const [fila] = await crear(tx, p, r, { zonaId: null, zonaOtro: "Barrio nuevo sin nombre" });
      expect(fila.motivo_rechazo).toBeNull();
      const [pub] = await tx`
        select zona_id, zona_otro_texto from publicaciones where id = ${fila.publicacion_id}`;
      expect(pub).toMatchObject({ zona_id: null, zona_otro_texto: "Barrio nuevo sin nombre" });
    });
  });

  it("un rubro inexistente se rechaza", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx);
      const [fila] = await crear(tx, p, 999999);
      expect(fila.motivo_rechazo).toBe("rubro_invalido");
    });
  });
});

describe("validación del formulario (7.3)", () => {
  const base = {
    ...camposVacios,
    tipo: "ofrezco" as const,
    subtipo: "servicio" as const,
    rubroId: "3",
    titulo: "Pinto casas",
  };

  it("paso 1: hay que elegir qué se quiere hacer, y el subtipo si es ofrezco", () => {
    expect(validarPaso1(camposVacios).tipo).toBeTruthy();
    expect(validarPaso1({ ...camposVacios, tipo: "ofrezco" }).subtipo).toBeTruthy();
    expect(validarPaso1({ ...camposVacios, tipo: "necesito" })).toEqual({});
    expect(validarPaso1(base)).toEqual({});
  });

  it("paso 2: rubro y título obligatorios; lo demás opcional (B1)", () => {
    expect(validarPaso2({ ...base, rubroId: "" }).rubroId).toBeTruthy();
    expect(validarPaso2({ ...base, titulo: "  " }).titulo).toBeTruthy();
    expect(validarPaso2({ ...base, titulo: "x".repeat(MAX_TITULO + 1) }).titulo).toBeTruthy();
    expect(validarPaso2({ ...base, descripcion: "x".repeat(MAX_DESCRIPCION + 1) }).descripcion).toBeTruthy();
    expect(validarPaso2(base)).toEqual({});
  });

  it('paso 2: si el rubro es "Otros", hay que escribir de qué se trata', () => {
    expect(validarPaso2(base, true).rubroOtroTexto).toBeTruthy();
    expect(validarPaso2({ ...base, rubroOtroTexto: "Herrería" }, true)).toEqual({});
  });

  it("paso 3: la zona es opcional, y no se puede elegir de la lista y escribirla a la vez", () => {
    expect(validarPaso3(base)).toEqual({});
    expect(validarPaso3({ ...base, zonaOtroTexto: "Mi zona" })).toEqual({});
    expect(validarPaso3({ ...base, zonaId: "4", zonaOtroTexto: "Mi zona" }).zonaOtroTexto).toBeTruthy();
  });

  it("normaliza y deja en null lo que quedó vacío", () => {
    const r = validarPublicacion({
      ...base,
      titulo: "  Pinto   casas  ",
      precioTexto: "   ",
      zonaOtroTexto: "  Barrio X ",
    });
    expect(r.ok && r.datos).toMatchObject({
      titulo: "Pinto casas",
      precioTexto: null,
      descripcion: null,
      zonaId: null,
      zonaOtroTexto: "Barrio X",
      subtipo: "servicio",
    });
  });

  it("en un necesito no queda subtipo", () => {
    const r = validarPublicacion({ ...base, tipo: "necesito", subtipo: "" });
    expect(r.ok && r.datos.subtipo).toBeNull();
  });
});

describe("compresión de la foto (R03)", () => {
  it("achica el lado más largo a 1280 y mantiene la proporción", () => {
    expect(dimensionesObjetivo(4000, 3000)).toEqual({ ancho: 1280, alto: 960 });
    expect(dimensionesObjetivo(3000, 4000)).toEqual({ ancho: 960, alto: 1280 });
    expect(dimensionesObjetivo(1280, 720)).toEqual({ ancho: 1280, alto: 720 });
  });

  it("no agranda una foto chica", () => {
    expect(dimensionesObjetivo(800, 600)).toEqual({ ancho: 800, alto: 600 });
    expect(LADO_MAXIMO).toBe(1280);
  });
});
