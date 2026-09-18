import type postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { conectar, enTransaccion } from "./db";

// Paso 11.5, las partes que viven en la base (migración 20260918100000_seguridad.sql).

const sql = conectar();
afterAll(() => sql.end());

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

async function persona(tx: postgres.TransactionSql, nombre: string, esOperador = false) {
  const tel = "549342" + Math.floor(Math.random() * 1e7).toString().padStart(7, "0");
  const hash = "h-" + tel + Math.random();
  const [p] = await tx`
    insert into personas (nombre, telefono, token_hash, terminos_aceptados_en, mayoria_edad_declarada, es_operador)
    values (${nombre}, ${tel}, ${hash}, now(), true, ${esOperador})
    returning id`;
  return { id: p.id as string, hash };
}

async function rubro(tx: postgres.TransactionSql) {
  const [r] = await tx`
    insert into rubros (nombre, familia, orden) values (${"R" + Math.random()}, 'servicio', 90) returning id`;
  return r.id as number;
}

const intento = (tx: postgres.TransactionSql, ip: string, accion: string, maximo: number) =>
  tx<{ registrar_intento: boolean }[]>`select registrar_intento(${ip}, ${accion}, ${maximo})`.then(
    ([f]) => f.registrar_intento,
  );

describe("límites por conexión (11.5, punto 3)", () => {
  it("deja hasta el máximo y después no, por conexión y por acción", async () => {
    await enTransaccion(sql, async (tx) => {
      for (let i = 0; i < 3; i++) expect(await intento(tx, HASH_A, "alta", 3)).toBe(true);
      expect(await intento(tx, HASH_A, "alta", 3)).toBe(false);
      // Otra conexión y otra acción tienen su propia cuenta.
      expect(await intento(tx, HASH_B, "alta", 3)).toBe(true);
      expect(await intento(tx, HASH_A, "denuncia_anonima", 3)).toBe(true);
    });
  });

  it("solo cuentan las últimas 24 horas", async () => {
    await enTransaccion(sql, async (tx) => {
      await tx`insert into limites (ip_hash, accion, creada_en)
               select ${HASH_A}, 'alta', now() - interval '25 hours' from generate_series(1, 5)`;
      expect(await intento(tx, HASH_A, "alta", 3)).toBe(true);
    });
  });

  it("la IP nunca se guarda en claro: solo acepta un hash SHA-256", async () => {
    await enTransaccion(sql, async (tx) => {
      await expect(tx`insert into limites (ip_hash, accion) values ('190.1.2.3', 'alta')`).rejects.toThrow(
        /limites_ip_hash_check/,
      );
    });
  });

  it("anon y authenticated no pueden leer ni escribir la tabla", async () => {
    const filas = await sql`
      select grantee from information_schema.role_table_grants
      where table_schema = 'public' and table_name = 'limites' and grantee in ('anon', 'authenticated')`;
    expect(filas).toHaveLength(0);
  });
});

describe("rotación del token (11.5, punto 4)", () => {
  const rotar = (tx: postgres.TransactionSql, actual: string, nuevo: string, dias = 30) =>
    tx<{ rotado: boolean; emitido_en: Date | null }[]>`
      select * from rotar_token(${actual}, ${nuevo}, ${dias})`.then(([f]) => f);

  it("un token nuevo no rota: devuelve cuándo se emitió", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx, "Token nuevo");
      const r = await rotar(tx, p.hash, "otro-hash");
      expect(r.rotado).toBe(false);
      expect(r.emitido_en).not.toBeNull();
      const [f] = await tx`select token_hash from personas where id = ${p.id}`;
      expect(f.token_hash).toBe(p.hash);
    });
  });

  it("con más de 30 días rota: el hash viejo deja de valer", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx, "Token viejo");
      await tx`update personas set token_emitido_en = now() - interval '31 days' where id = ${p.id}`;
      const r = await rotar(tx, p.hash, "hash-nuevo");
      expect(r.rotado).toBe(true);
      const [f] = await tx`select token_hash from personas where id = ${p.id}`;
      expect(f.token_hash).toBe("hash-nuevo");
      expect((await rotar(tx, p.hash, "otro")).emitido_en).toBeNull();
    });
  });

  it("un token que no existe o de una cuenta dada de baja no vale", async () => {
    await enTransaccion(sql, async (tx) => {
      expect((await rotar(tx, "no-existe", "x")).emitido_en).toBeNull();
      const p = await persona(tx, "Archivada");
      await tx`update personas set archivado_en = now() where id = ${p.id}`;
      expect((await rotar(tx, p.hash, "x")).emitido_en).toBeNull();
    });
  });
});

describe("baja con borrado de datos (11.5, punto 9; Ley 25.326)", () => {
  const baja = (tx: postgres.TransactionSql, personaId: string, operadorId: string) =>
    tx<{ ok: boolean; motivo_rechazo: string | null; fotos: string[] | null }[]>`
      select * from dar_de_baja(${personaId}::uuid, ${operadorId}::uuid)`.then(([f]) => f);

  it("solo la hace un operador", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx, "Ana");
      const otra = await persona(tx, "Beto");
      expect(await baja(tx, p.id, otra.id)).toMatchObject({ ok: false, motivo_rechazo: "no_sos_operador" });
    });
  });

  it("borra teléfono y nombre, invalida la sesión y limpia y archiva las publicaciones", async () => {
    await enTransaccion(sql, async (tx) => {
      const op = await persona(tx, "Equipo", true);
      const p = await persona(tx, "Ana");
      const r = await rubro(tx);
      await tx`
        insert into publicaciones (persona_id, tipo, subtipo, rubro_id, titulo, descripcion, alias_pago, foto_url)
        values (${p.id}, 'ofrezco', 'servicio', ${r}, 'Costura', 'Llamame al 342 555', 'ana.mp', 'http://x/foto.jpg')`;

      const resultado = await baja(tx, p.id, op.id);
      expect(resultado).toMatchObject({ ok: true, fotos: ["http://x/foto.jpg"] });

      const [per] = await tx`select nombre, telefono, token_hash, archivado_en from personas where id = ${p.id}`;
      expect(per).toMatchObject({ nombre: "Cuenta dada de baja", telefono: null });
      expect(per.token_hash).not.toBe(p.hash);
      expect(per.archivado_en).not.toBeNull();

      const [pub] = await tx`
        select estado, titulo, descripcion, alias_pago, foto_url, archivado_en from publicaciones where persona_id = ${p.id}`;
      expect(pub).toMatchObject({
        estado: "archivada",
        titulo: "Publicación dada de baja",
        descripcion: null,
        alias_pago: null,
        foto_url: null,
      });

      const [accion] = await tx`
        select accion from acciones_operador where operador_id = ${op.id} and objetivo_id = ${p.id}`;
      expect(accion.accion).toBe("dar_de_baja");

      expect(await baja(tx, p.id, op.id)).toMatchObject({ ok: false, motivo_rechazo: "no_existe" });
    });
  });

  it("una cuenta activa no puede quedar sin teléfono", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx, "Ana");
      await expect(tx`update personas set telefono = null where id = ${p.id}`).rejects.toThrow(
        /personas_telefono_si_activa/,
      );
    });
  });
});

describe("listado: rotación como máximo una vez por minuto (8.2 + 11.5)", () => {
  it("lo mostrado hace menos de un minuto no se vuelve a escribir; lo más viejo sí", async () => {
    await enTransaccion(sql, async (tx) => {
      const p = await persona(tx, "Rotación");
      const r = await rubro(tx);
      const [reciente] = await tx`
        insert into publicaciones (persona_id, tipo, subtipo, rubro_id, titulo, ultima_exposicion)
        values (${p.id}, 'ofrezco', 'servicio', ${r}, 'Reciente', now() - interval '30 seconds')
        returning id, ultima_exposicion`;
      const [vieja] = await tx`
        insert into publicaciones (persona_id, tipo, subtipo, rubro_id, titulo, ultima_exposicion)
        values (${p.id}, 'ofrezco', 'servicio', ${r}, 'Vieja', now() - interval '2 minutes')
        returning id`;

      await tx`select * from listar_publicaciones('ofrezco', null, ${r}, null, 10, array[]::uuid[])`;

      const [a] = await tx`select ultima_exposicion from publicaciones where id = ${reciente.id}`;
      const [b] = await tx`select ultima_exposicion = now() as rotada from publicaciones where id = ${vieja.id}`;
      expect(a.ultima_exposicion).toEqual(reciente.ultima_exposicion);
      expect(b.rotada).toBe(true);
    });
  });
});
