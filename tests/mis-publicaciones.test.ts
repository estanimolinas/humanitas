import type postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { conectar, enTransaccion } from "./db";

const sql = conectar();
afterAll(() => sql.end());

type Resultado = { ok: boolean; motivo_rechazo: string | null };

const cerrar = (
  tx: postgres.TransactionSql,
  pub: string,
  persona: string,
  motivo: string,
  quienHizo: string | null = null,
) =>
  tx<Resultado[]>`
    select * from cerrar_publicacion(${pub}::uuid, ${persona}::uuid, ${motivo}, ${quienHizo}::uuid)`;

const reactivar = (tx: postgres.TransactionSql, pub: string, persona: string) =>
  tx<Resultado[]>`select * from reactivar_publicacion(${pub}::uuid, ${persona}::uuid)`;

async function persona(tx: postgres.TransactionSql, nombre: string) {
  const tel = "549342" + Math.floor(Math.random() * 1e7).toString().padStart(7, "0");
  const [p] = await tx`
    insert into personas (nombre, telefono, token_hash, terminos_aceptados_en, mayoria_edad_declarada)
    values (${nombre}, ${tel}, ${"h-" + tel}, now(), true) returning id`;
  return p.id as string;
}

async function publicar(tx: postgres.TransactionSql, personaId: string, tipo = "necesito") {
  const [r] = await tx`
    insert into rubros (nombre, familia, orden) values (${"R" + Math.random()}, 'servicio', 90) returning id`;
  const [p] = await tx`
    insert into publicaciones (persona_id, tipo, subtipo, rubro_id, titulo, vence_en)
    values (${personaId}, ${tipo}, ${tipo === "ofrezco" ? "servicio" : null}, ${r.id},
            'Pedido de prueba', now() + interval '10 days')
    returning id`;
  return p.id as string;
}

const contactar = (tx: postgres.TransactionSql, pub: string, quien: string) =>
  tx`insert into contactos (publicacion_id, persona_solicitante_id) values (${pub}, ${quien})`;

const concretadosDe = async (tx: postgres.TransactionSql, quien: string) => {
  const [{ n }] = await tx`select count(*)::int as n from concretados where persona_que_hizo_id = ${quien}`;
  return n as number;
};

describe("cerrar (7.4, 8.4, D1, D2)", () => {
  it("R06: al cerrar como resuelto y elegir a quien lo hizo, su contador sube en 1", async () => {
    await enTransaccion(sql, async (tx) => {
      const pide = await persona(tx, "Lucía");
      const hace = await persona(tx, "Rubén");
      const pub = await publicar(tx, pide);
      await contactar(tx, pub, hace);

      expect(await concretadosDe(tx, hace)).toBe(0);
      const [r] = await cerrar(tx, pub, pide, "resuelta_con_alguien_de_aca", hace);
      expect(r.ok).toBe(true);
      expect(await concretadosDe(tx, hace)).toBe(1);

      const [p] = await tx`select estado, cierre_motivo, cerrada_en from publicaciones where id = ${pub}`;
      expect(p).toMatchObject({ estado: "cerrada", cierre_motivo: "resuelta_con_alguien_de_aca" });
      expect(p.cerrada_en).toBeInstanceOf(Date);

      // D1: cerrada deja de aparecer en el tablero.
      const listado = await tx`select id from listar_publicaciones('necesito', null, null, null, 50, '{}'::uuid[])`;
      expect(listado.map((f) => f.id)).not.toContain(pub);
    });
  });

  it("8.4: no se puede elegir a alguien que no pidió contacto", async () => {
    await enTransaccion(sql, async (tx) => {
      const pide = await persona(tx, "Lucía");
      const ajeno = await persona(tx, "Ajeno");
      const pub = await publicar(tx, pide);

      const [r] = await cerrar(tx, pub, pide, "resuelta_con_alguien_de_aca", ajeno);
      expect(r).toMatchObject({ ok: false, motivo_rechazo: "no_te_contacto" });
      expect(await concretadosDe(tx, ajeno)).toBe(0);
    });
  });

  it("8.4: nadie se autoasigna un concretado", async () => {
    await enTransaccion(sql, async (tx) => {
      const pide = await persona(tx, "Lucía");
      const pub = await publicar(tx, pide);
      await contactar(tx, pub, pide); // se contacta a sí misma
      await expect(cerrar(tx, pub, pide, "resuelta_con_alguien_de_aca", pide)).rejects.toThrow(/check/);
    });
  });

  it("resuelto por otro lado o ya no lo necesita: cierra sin sumar a nadie", async () => {
    await enTransaccion(sql, async (tx) => {
      for (const motivo of ["resuelta_por_otro_lado", "ya_no_la_necesita"]) {
        const pide = await persona(tx, "Lucía");
        const hace = await persona(tx, "Rubén");
        const pub = await publicar(tx, pide);
        await contactar(tx, pub, hace);
        const [r] = await cerrar(tx, pub, pide, motivo);
        expect(r.ok, motivo).toBe(true);
        expect(await concretadosDe(tx, hace)).toBe(0);
      }
    });
  });

  it("un ofrezco se cierra sin preguntar nada", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Rubén");
      const pub = await publicar(tx, duenio, "ofrezco");
      const [malMotivo] = await cerrar(tx, pub, duenio, "resuelta_con_alguien_de_aca");
      expect(malMotivo.motivo_rechazo).toBe("motivo_invalido");
      const [r] = await cerrar(tx, pub, duenio, "cerrada_por_duenio");
      expect(r.ok).toBe(true);
    });
  });

  it("nadie puede cerrar una publicación ajena", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Dueña");
      const otro = await persona(tx, "Otro");
      const pub = await publicar(tx, duenio);
      const [r] = await cerrar(tx, pub, otro, "ya_no_la_necesita");
      expect(r).toMatchObject({ ok: false, motivo_rechazo: "no_es_tuya" });
      const [p] = await tx`select estado from publicaciones where id = ${pub}`;
      expect(p.estado).toBe("activa");
    });
  });

  it("una publicación ya cerrada no se cierra dos veces", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Dueña");
      const pub = await publicar(tx, duenio);
      await cerrar(tx, pub, duenio, "ya_no_la_necesita");
      const [r] = await cerrar(tx, pub, duenio, "ya_no_la_necesita");
      expect(r).toMatchObject({ ok: false, motivo_rechazo: "no_esta_activa" });
    });
  });
});

describe("reactivar (5.2, R06)", () => {
  it("vuelve a activa con vigencia nueva y aparece otra vez en el listado", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Dueña");
      const pub = await publicar(tx, duenio);
      await cerrar(tx, pub, duenio, "ya_no_la_necesita");

      const [r] = await reactivar(tx, pub, duenio);
      expect(r.ok).toBe(true);

      const [p] = await tx`
        select estado, cierre_motivo, cerrada_en,
               round(extract(epoch from (vence_en - now()))/86400) as dias
        from publicaciones where id = ${pub}`;
      expect(p).toMatchObject({ estado: "activa", cierre_motivo: null, cerrada_en: null });
      expect(Number(p.dias)).toBe(30);
    });
  });

  it("no altera la rotación: sigue con su ultima_exposicion (8.2)", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Dueña");
      const pub = await publicar(tx, duenio);
      await tx`update publicaciones set ultima_exposicion = now() where id = ${pub}`;
      const [antes] = await tx`select ultima_exposicion from publicaciones where id = ${pub}`;
      await cerrar(tx, pub, duenio, "ya_no_la_necesita");
      await reactivar(tx, pub, duenio);
      const [despues] = await tx`select ultima_exposicion from publicaciones where id = ${pub}`;
      expect(despues.ultima_exposicion).toEqual(antes.ultima_exposicion);
    });
  });

  it("no se puede reactivar una publicación ajena ni una que está activa", async () => {
    await enTransaccion(sql, async (tx) => {
      const duenio = await persona(tx, "Dueña");
      const otro = await persona(tx, "Otro");
      const pub = await publicar(tx, duenio);
      expect((await reactivar(tx, pub, duenio))[0].motivo_rechazo).toBe("no_esta_cerrada");
      await cerrar(tx, pub, duenio, "ya_no_la_necesita");
      expect((await reactivar(tx, pub, otro))[0].motivo_rechazo).toBe("no_es_tuya");
    });
  });
});
