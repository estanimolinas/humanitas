import type postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { esMotivoValido, MOTIVOS_DENUNCIA } from "@/lib/denuncias";
import { conectar, enTransaccion } from "./db";

const sql = conectar();
afterAll(() => sql.end());

type FilaDenuncia = { ok: boolean; motivo_rechazo: string | null; quedo_oculta: boolean };
type FilaOk = { ok: boolean; motivo_rechazo: string | null };

const denunciar = (
  tx: postgres.TransactionSql,
  pub: string,
  persona: string | null,
  motivo = "estafa",
  detalle: string | null = null,
) =>
  tx<FilaDenuncia[]>`
    select * from registrar_denuncia(${pub}::uuid, ${persona}::uuid, ${motivo}, ${detalle})`;

const resolver = (
  tx: postgres.TransactionSql,
  pub: string,
  operador: string,
  accion: string,
  resolucion = "revisada",
) =>
  tx<FilaOk[]>`select * from resolver_revision(${pub}::uuid, ${operador}::uuid, ${accion}, ${resolucion})`;

async function persona(tx: postgres.TransactionSql, nombre: string, esOperador = false) {
  const tel = "549342" + Math.floor(Math.random() * 1e7).toString().padStart(7, "0");
  const [p] = await tx`
    insert into personas (nombre, telefono, token_hash, terminos_aceptados_en, mayoria_edad_declarada, es_operador)
    values (${nombre}, ${tel}, ${"h-" + tel + Math.random()}, now(), true, ${esOperador})
    returning id`;
  return p.id as string;
}

async function publicar(tx: postgres.TransactionSql, personaId: string) {
  const [r] = await tx`
    insert into rubros (nombre, familia, orden) values (${"R" + Math.random()}, 'servicio', 90) returning id`;
  const [p] = await tx`
    insert into publicaciones (persona_id, tipo, subtipo, rubro_id, titulo)
    values (${personaId}, 'ofrezco', 'servicio', ${r.id}, 'Publicación denunciada')
    returning id`;
  return p.id as string;
}

const estadoDe = async (tx: postgres.TransactionSql, pub: string) => {
  const [p] = await tx`select estado from publicaciones where id = ${pub}`;
  return p.estado as string;
};

describe("motivos (10.5)", () => {
  it("son los cuatro cerrados del requerimiento", () => {
    expect(MOTIVOS_DENUNCIA.map((m) => m.valor)).toEqual([
      "estafa",
      "contenido_inapropiado",
      "posible_menor",
      "otro",
    ]);
    expect(esMotivoValido("estafa")).toBe(true);
    expect(esMotivoValido("cualquier_cosa")).toBe(false);
  });
});

describe("R09 / E3: denunciar", () => {
  it("dos denuncias de personas distintas ocultan la publicación", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Dueño");
      const pub = await publicar(tx, duenio);
      const una = await persona(tx, "Vecina 1");
      const otra = await persona(tx, "Vecino 2");

      const [primera] = await denunciar(tx, pub, una);
      expect(primera).toMatchObject({ ok: true, quedo_oculta: false });
      expect(await estadoDe(tx, pub)).toBe("activa");

      const [segunda] = await denunciar(tx, pub, otra, "contenido_inapropiado");
      expect(segunda).toMatchObject({ ok: true, quedo_oculta: true });
      expect(await estadoDe(tx, pub)).toBe("en_revision");

      // Oculta también quiere decir fuera del listado.
      const listado = await tx`select id from listar_publicaciones('ofrezco', null, null, null, 50, '{}'::uuid[])`;
      expect(listado.map((f) => f.id)).not.toContain(pub);
    });
  });

  it("la misma persona denunciando dos veces no la oculta", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Dueño");
      const pub = await publicar(tx, duenio);
      const una = await persona(tx, "Vecina");

      await denunciar(tx, pub, una);
      const [repetida] = await denunciar(tx, pub, una, "otro");
      expect(repetida).toMatchObject({ ok: true, quedo_oculta: false });
      expect(await estadoDe(tx, pub)).toBe("activa");

      const [{ n }] = await tx`select count(*)::int as n from denuncias where publicacion_id = ${pub}`;
      expect(n).toBe(1);
    });
  });

  it("las denuncias sin cuenta quedan registradas pero no ocultan solas", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Dueño");
      const pub = await publicar(tx, duenio);

      await denunciar(tx, pub, null, "estafa", "Pide plata por adelantado");
      await denunciar(tx, pub, null, "estafa", "A mí también");
      expect(await estadoDe(tx, pub)).toBe("activa");

      const [{ n }] = await tx`select count(*)::int as n from denuncias where publicacion_id = ${pub}`;
      expect(n).toBe(2);
    });
  });

  it("rechaza motivos que no están en la lista", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Dueño");
      const pub = await publicar(tx, duenio);
      const quien = await persona(tx, "Vecina");
      const [r] = await denunciar(tx, pub, quien, "porque si");
      expect(r).toMatchObject({ ok: false, motivo_rechazo: "motivo_invalido" });
    });
  });
});

describe("operador (R09, P2, E4)", () => {
  it("archiva la publicación, resuelve las denuncias y queda registrado quién lo hizo", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Dueño");
      const operador = await persona(tx, "Operadora", true);
      const pub = await publicar(tx, duenio);
      await denunciar(tx, pub, await persona(tx, "V1"));
      await denunciar(tx, pub, await persona(tx, "V2"), "posible_menor");

      const [r] = await resolver(tx, pub, operador, "archivar", "Se confirmó la denuncia");
      expect(r.ok).toBe(true);
      expect(await estadoDe(tx, pub)).toBe("archivada");

      const [{ sin_resolver }] = await tx`
        select count(*)::int as sin_resolver from denuncias
        where publicacion_id = ${pub} and resuelta_en is null`;
      expect(sin_resolver).toBe(0);

      const [accion] = await tx`
        select accion, objetivo_tipo, objetivo_id, operador_id from acciones_operador
        where objetivo_id = ${pub}`;
      expect(accion).toMatchObject({
        accion: "archivar",
        objetivo_tipo: "publicacion",
        operador_id: operador,
      });
    });
  });

  it("puede devolver al listado una publicación injustamente denunciada", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Dueño");
      const operador = await persona(tx, "Operadora", true);
      const pub = await publicar(tx, duenio);
      await denunciar(tx, pub, await persona(tx, "V1"));
      await denunciar(tx, pub, await persona(tx, "V2"));
      expect(await estadoDe(tx, pub)).toBe("en_revision");

      const [r] = await resolver(tx, pub, operador, "reactivar", "Denuncia sin fundamento");
      expect(r.ok).toBe(true);
      expect(await estadoDe(tx, pub)).toBe("activa");
    });
  });

  it("quien no es operador no puede resolver nada", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Dueño");
      const cualquiera = await persona(tx, "Cualquiera");
      const pub = await publicar(tx, duenio);
      await denunciar(tx, pub, await persona(tx, "V1"));

      const [r] = await resolver(tx, pub, cualquiera, "archivar");
      expect(r).toMatchObject({ ok: false, motivo_rechazo: "no_sos_operador" });
      expect(await estadoDe(tx, pub)).toBe("activa");
      const [{ n }] = await tx`
        select count(*)::int as n from acciones_operador where operador_id = ${cualquiera}`;
      expect(n).toBe(0);
    });
  });
});

describe("R14 / E2: verificación presencial", () => {
  const verificar = (tx: postgres.TransactionSql, quien: string, referente: string) =>
    tx<{ ok: boolean; motivo_rechazo: string | null; lugar: string | null }[]>`
      select * from verificar_persona(${quien}::uuid, ${referente}::uuid)`;

  async function referente(tx: postgres.TransactionSql, lugar: string, activo = true) {
    const p = await persona(tx, "Referente");
    await tx`insert into referentes (persona_id, lugar, activo) values (${p}, ${lugar}, ${activo})`;
    return p;
  }

  it("un referente activo deja registrado quién, cuándo y dónde", async () => {
    await enTransaccion(sql, async (tx) => {
      const ref = await referente(tx, "Vecinal Los Hornos");
      const vecina = await persona(tx, "Vecina");

      const [r] = await verificar(tx, vecina, ref);
      expect(r).toMatchObject({ ok: true, lugar: "Vecinal Los Hornos" });

      const [p] = await tx`
        select verificado_lugar, verificado_en, verificado_por_referente_id from personas where id = ${vecina}`;
      expect(p.verificado_lugar).toBe("Vecinal Los Hornos");
      expect(p.verificado_en).toBeInstanceOf(Date);
      expect(p.verificado_por_referente_id).toBeTruthy();

      const [accion] = await tx`
        select accion, objetivo_tipo from acciones_operador where objetivo_id = ${vecina}`;
      expect(accion).toMatchObject({ accion: "verificar_persona", objetivo_tipo: "persona" });
    });
  });

  it("quien no es referente activo no puede verificar a nadie", async () => {
    await enTransaccion(sql, async (tx) => {
      const cualquiera = await persona(tx, "Cualquiera");
      const inactivo = await referente(tx, "Vecinal vieja", false);
      const vecina = await persona(tx, "Vecina");

      expect((await verificar(tx, vecina, cualquiera))[0].motivo_rechazo).toBe("no_sos_referente");
      expect((await verificar(tx, vecina, inactivo))[0].motivo_rechazo).toBe("no_sos_referente");

      const [p] = await tx`select verificado_lugar from personas where id = ${vecina}`;
      expect(p.verificado_lugar).toBeNull();
    });
  });

  it("un referente no se verifica a sí mismo", async () => {
    await enTransaccion(sql, async (tx) => {
      const ref = await referente(tx, "Parroquia");
      const [r] = await verificar(tx, ref, ref);
      expect(r.motivo_rechazo).toBe("no_te_verificas_sola");
    });
  });
});
