import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { conectar, enTransaccion } from "./db";

const sql = conectar();
afterAll(() => sql.end());

const CON_ARCHIVADO = [
  "personas",
  "publicaciones",
  "contactos",
  "denuncias",
  "referentes",
  "rubros",
  "zonas",
];
const SIN_ARCHIVADO = ["eventos", "concretados", "acciones_operador", "eventos_mensuales"];
const TODAS = [...CON_ARCHIVADO, ...SIN_ARCHIVADO];

async function crearPersona(tx: postgres.TransactionSql, telefono = "5493425000001") {
  const [p] = await tx`
    insert into personas (nombre, telefono, token_hash, terminos_aceptados_en, mayoria_edad_declarada)
    values ('Ana', ${telefono}, ${"hash-" + telefono}, now(), true)
    returning id`;
  return p.id as string;
}

async function rubroId(tx: postgres.TransactionSql, familia: string) {
  const [r] = await tx`select id from rubros where familia = ${familia} order by orden limit 1`;
  return r.id as number;
}

describe("esquema 12.3", () => {
  it("existen exactamente las tablas del modelo de datos", async () => {
    const filas = await sql`
      select table_name from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'`;
    expect(filas.map((f) => f.table_name).sort()).toEqual([...TODAS].sort());
  });

  it("R12: archivado_en (timestamptz nullable) en toda tabla que admite baja, y no en las demás", async () => {
    const filas = await sql`
      select table_name, data_type, is_nullable from information_schema.columns
      where table_schema = 'public' and column_name = 'archivado_en'`;
    const porTabla = Object.fromEntries(filas.map((f) => [f.table_name, f]));
    for (const t of CON_ARCHIVADO) {
      expect(porTabla[t], t).toMatchObject({
        data_type: "timestamp with time zone",
        is_nullable: "YES",
      });
    }
    for (const t of SIN_ARCHIVADO) expect(porTabla[t], t).toBeUndefined();

    const viejo = await sql`
      select table_name from information_schema.columns
      where table_schema = 'public' and column_name = 'archivada_en'`;
    expect(viejo).toHaveLength(0);
  });

  it("personas tiene los campos del alta y del operador", async () => {
    const filas = await sql`
      select column_name, data_type, is_nullable from information_schema.columns
      where table_schema = 'public' and table_name = 'personas'`;
    const c = Object.fromEntries(filas.map((f) => [f.column_name, f]));
    expect(c.token_hash).toMatchObject({ data_type: "text", is_nullable: "NO" });
    expect(c.terminos_aceptados_en).toMatchObject({ is_nullable: "NO" });
    expect(c.mayoria_edad_declarada).toMatchObject({ data_type: "boolean", is_nullable: "NO" });
    expect(c.es_operador).toMatchObject({ data_type: "boolean", is_nullable: "NO" });
  });
});

describe("R12 / F3: ningún DELETE", () => {
  it("toda tabla salvo eventos tiene los triggers que impiden DELETE y TRUNCATE", async () => {
    const filas = await sql`
      select c.relname as tabla, t.tgname as nombre
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_proc p on p.oid = t.tgfoid
      where n.nspname = 'public' and p.proname = 'impedir_borrado' and not t.tgisinternal`;
    const esperados = TODAS.filter((t) => t !== "eventos").flatMap((t) => [
      `${t}:${t}_sin_delete`,
      `${t}:${t}_sin_truncate`,
    ]);
    expect(filas.map((f) => `${f.tabla}:${f.nombre}`).sort()).toEqual(esperados.sort());
  });

  it("la base rechaza DELETE sobre filas existentes (personas, rubros)", async () => {
    await enTransaccion(sql, async (tx) => {
      await crearPersona(tx);
      await tx`savepoint s`;
      await expect(tx`delete from personas`).rejects.toThrow(/no se borran filas/);
      await tx`rollback to savepoint s`;
      await expect(tx`delete from rubros`).rejects.toThrow(/no se borran filas/);
    });
  });

  it("la base rechaza TRUNCATE en toda tabla salvo eventos", async () => {
    for (const t of TODAS.filter((t) => t !== "eventos")) {
      await enTransaccion(sql, async (tx) => {
        await expect(tx.unsafe(`truncate public.${t} cascade`), t).rejects.toThrow(
          /no se borran filas/,
        );
      });
    }
  });

  it("eventos sí admite DELETE (única excepción: poda manual)", async () => {
    await enTransaccion(sql, async (tx) => {
      await tx`insert into eventos (tipo) values ('vista')`;
      const borradas = await tx`delete from eventos returning id`;
      expect(borradas.length).toBeGreaterThan(0);
    });
  });

  it("no hay DELETE en el código de la app", () => {
    const dirs = ["app", "lib", "scripts"];
    // Única excepción permitida (paso 9): el script de poda de eventos.
    const permitidos = new Set<string>(["scripts/podar-eventos.ts"]);
    const archivos: string[] = [];
    const recorrer = (dir: string) => {
      let entradas: string[];
      try {
        entradas = readdirSync(dir);
      } catch {
        return;
      }
      for (const e of entradas) {
        const ruta = join(dir, e);
        if (statSync(ruta).isDirectory()) recorrer(ruta);
        else if (/\.(ts|tsx|js|mjs|sql)$/.test(e)) archivos.push(ruta);
      }
    };
    dirs.forEach(recorrer);
    // Solo borrados en la base: `delete from …` en SQL y `.from("x").delete()` de supabase-js.
    // No cuenta borrar una cookie (cookies().delete), que no toca la base.
    const conDelete = archivos.filter(
      (a) =>
        !permitidos.has(a) &&
        /\bdelete\s+from\b|\.from\([^)]*\)[\s\S]{0,80}?\.delete\s*\(|\brpc\([^)]*borrar/i.test(
          readFileSync(a, "utf8"),
        ),
    );
    expect(conDelete).toEqual([]);
  });
});

describe("acceso: el cliente nunca habla con Supabase", () => {
  it("anon y authenticated no pueden leer ninguna tabla", async () => {
    for (const rol of ["anon", "authenticated"]) {
      for (const t of TODAS) {
        await enTransaccion(sql, async (tx) => {
          await tx.unsafe(`set local role ${rol}`);
          await expect(tx.unsafe(`select 1 from public.${t} limit 1`), `${rol} ${t}`).rejects.toThrow(
            /permission denied/,
          );
        });
      }
    }
  });

  it("RLS está activo en todas las tablas", async () => {
    const filas = await sql`
      select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`;
    expect(filas).toHaveLength(0);
  });

  it("bucket fotos: público, 200 KB, solo jpeg/webp", async () => {
    const [b] = await sql`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'fotos'`;
    expect(b).toMatchObject({ public: true, file_size_limit: "204800" });
    expect(b.allowed_mime_types).toEqual(["image/jpeg", "image/webp"]);
    const [{ n }] = await sql`select count(*)::int as n from storage.buckets`;
    expect(n).toBe(1);
  });
});

describe("reglas en el esquema", () => {
  it("un teléfono = una cuenta (8.5), normalizado 549…", async () => {
    await enTransaccion(sql, async (tx) => {
      await crearPersona(tx, "5493425000001");
      await tx`savepoint s`;
      await expect(crearPersona(tx, "5493425000001")).rejects.toThrow(/personas_telefono_key/);
      await tx`rollback to savepoint s`;
      await expect(crearPersona(tx, "03425000001")).rejects.toThrow(/check/);
    });
  });

  it("R16: no se da de alta sin declarar mayoría de edad", async () => {
    await enTransaccion(sql, async (tx) => {
      await expect(tx`
        insert into personas (nombre, telefono, token_hash, terminos_aceptados_en, mayoria_edad_declarada)
        values ('Ana', '5493425000002', 'h', now(), false)`).rejects.toThrow(/check/);
    });
  });

  it("publicación: título ≤ 60, descripción ≤ 500, subtipo según tipo, nace activa y nunca expuesta", async () => {
    await enTransaccion(sql, async (tx) => {
      const persona = await crearPersona(tx);
      const rubro = await rubroId(tx, "servicio");
      const insertar = (tipo: string, subtipo: string | null, titulo: string, descripcion: string | null = null) =>
        tx`insert into publicaciones (persona_id, tipo, subtipo, rubro_id, titulo, descripcion)
           values (${persona}, ${tipo}, ${subtipo}, ${rubro}, ${titulo}, ${descripcion})
           returning estado, ultima_exposicion = '-infinity' as nunca_expuesta`;

      const [ok] = await insertar("ofrezco", "servicio", "Pinto casas");
      expect(ok).toMatchObject({ estado: "activa", nunca_expuesta: true });

      for (const [tipo, subtipo, titulo, desc] of [
        ["ofrezco", "servicio", "x".repeat(61), null],
        ["ofrezco", "servicio", "ok", "x".repeat(501)],
        ["ofrezco", null, "ok", null],
        ["necesito", "servicio", "ok", null],
      ] as const) {
        await tx`savepoint s`;
        await expect(insertar(tipo, subtipo, titulo, desc)).rejects.toThrow(/check/);
        await tx`rollback to savepoint s`;
      }
    });
  });

  it("8.4: un concretado no se autoasigna y cada necesito suma una sola vez", async () => {
    await enTransaccion(sql, async (tx) => {
      const pide = await crearPersona(tx, "5493425000001");
      const hace = await crearPersona(tx, "5493425000002");
      const rubro = await rubroId(tx, "servicio");
      const [pub] = await tx`
        insert into publicaciones (persona_id, tipo, rubro_id, titulo)
        values (${pide}, 'necesito', ${rubro}, 'Arreglar canilla') returning id`;

      await tx`savepoint s`;
      await expect(tx`
        insert into concretados (publicacion_necesito_id, persona_que_hizo_id, confirmado_por_persona_id)
        values (${pub.id}, ${pide}, ${pide})`).rejects.toThrow(/check/);
      await tx`rollback to savepoint s`;

      await tx`
        insert into concretados (publicacion_necesito_id, persona_que_hizo_id, confirmado_por_persona_id)
        values (${pub.id}, ${hace}, ${pide})`;
      await expect(tx`
        insert into concretados (publicacion_necesito_id, persona_que_hizo_id, confirmado_por_persona_id)
        values (${pub.id}, ${hace}, ${pide})`).rejects.toThrow(/unique|duplicate/);
    });
  });
});

describe("seed", () => {
  it("rubros de la sección 6: 13 servicios y 8 productos, con Otros en cada familia", async () => {
    const filas = await sql`select familia, count(*)::int as n from rubros group by familia`;
    expect(Object.fromEntries(filas.map((f) => [f.familia, f.n]))).toEqual({ servicio: 13, producto: 8 });
    const otros = await sql`select familia from rubros where nombre = 'Otros' order by familia`;
    expect(otros.map((o) => o.familia)).toEqual(["producto", "servicio"]);
  });

  it("zonas: Santa Fe > localidad > una sola zona, la norte (decisión 18/09)", async () => {
    const [prov] = await sql`select id from zonas where tipo = 'provincia' and nombre = 'Santa Fe'`;
    const [loc] = await sql`select id from zonas where tipo = 'localidad' and parent_id = ${prov.id}`;
    const barrios = await sql`select nombre from zonas where tipo = 'barrio' and parent_id = ${loc.id}`;
    expect(barrios.map((b) => b.nombre)).toEqual(["Zona norte"]);
  });
});
