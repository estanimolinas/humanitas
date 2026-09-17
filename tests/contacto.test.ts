import type postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { LIMITE_CONTACTOS_POR_DIA, linkContacto } from "@/lib/whatsapp";
import { conectar, enTransaccion } from "./db";

const sql = conectar();
afterAll(() => sql.end());

type FilaContacto = {
  limite_alcanzado: boolean;
  telefono: string | null;
  titulo: string | null;
  nombre: string | null;
};

const registrar = (tx: postgres.TransactionSql, publicacionId: string, personaId: string) =>
  tx<FilaContacto[]>`select * from registrar_contacto(${publicacionId}::uuid, ${personaId}::uuid)`;

async function persona(tx: postgres.TransactionSql, nombre: string, telefono: string) {
  const [p] = await tx`
    insert into personas (nombre, telefono, token_hash, terminos_aceptados_en, mayoria_edad_declarada)
    values (${nombre}, ${telefono}, ${"h-" + telefono}, now(), true)
    returning id`;
  return p.id as string;
}

async function publicacion(tx: postgres.TransactionSql, personaId: string, estado = "activa") {
  const [r] = await tx`
    insert into rubros (nombre, familia, orden) values (${"Rubro " + Math.random()}, 'servicio', 90)
    returning id`;
  const [p] = await tx`
    insert into publicaciones (persona_id, tipo, subtipo, rubro_id, titulo, estado)
    values (${personaId}, 'ofrezco', 'servicio', ${r.id}, 'Pinto casas', ${estado})
    returning id`;
  return p.id as string;
}

describe("linkContacto (R04)", () => {
  it("cita la publicación y usa el teléfono normalizado", () => {
    const link = linkContacto({
      telefono: "5493425123456",
      titulo: "Revoque y humedad",
      nombreDestinatario: "Rubén",
      nombreRemitente: "Ana",
    });
    expect(link.startsWith("https://wa.me/5493425123456?text=")).toBe(true);
    const texto = decodeURIComponent(link.split("text=")[1]);
    expect(texto).toContain("Revoque y humedad");
    expect(texto).toContain("Rubén");
    expect(texto).toContain("Ana");
  });
});

describe("registrar_contacto (8.3, 8.5)", () => {
  it("registra el contacto y devuelve el teléfono para armar el link", async () => {
    await enTransaccion(sql, async (tx) => {
      const ofrece = await persona(tx, "Rubén", "5493425111111");
      const pide = await persona(tx, "Ana", "5493425222222");
      const pub = await publicacion(tx, ofrece);

      const [fila] = await registrar(tx, pub, pide);
      expect(fila).toMatchObject({
        limite_alcanzado: false,
        telefono: "5493425111111",
        titulo: "Pinto casas",
        nombre: "Rubén",
      });

      const [{ n }] = await tx`
        select count(*)::int as n from contactos
        where publicacion_id = ${pub} and persona_solicitante_id = ${pide}`;
      expect(n).toBe(1);
    });
  });

  it("cada toque queda registrado: la trazabilidad es por revelación (8.3)", async () => {
    await enTransaccion(sql, async (tx) => {
      const ofrece = await persona(tx, "Rubén", "5493425111111");
      const pide = await persona(tx, "Ana", "5493425222222");
      const pub = await publicacion(tx, ofrece);
      await registrar(tx, pub, pide);
      await registrar(tx, pub, pide);
      const [{ n }] = await tx`select count(*)::int as n from contactos where publicacion_id = ${pub}`;
      expect(n).toBe(2);
    });
  });

  it(`corta en ${LIMITE_CONTACTOS_POR_DIA} contactos por día y no devuelve el teléfono (R10)`, async () => {
    await enTransaccion(sql, async (tx) => {
      const ofrece = await persona(tx, "Rubén", "5493425111111");
      const pide = await persona(tx, "Ana", "5493425222222");
      const pub = await publicacion(tx, ofrece);

      for (let i = 0; i < LIMITE_CONTACTOS_POR_DIA; i++) {
        const [fila] = await registrar(tx, pub, pide);
        expect(fila.limite_alcanzado, `contacto ${i + 1}`).toBe(false);
      }

      const [pasado] = await registrar(tx, pub, pide);
      expect(pasado.limite_alcanzado).toBe(true);
      expect(pasado.telefono).toBeNull();

      const [{ n }] = await tx`
        select count(*)::int as n from contactos where persona_solicitante_id = ${pide}`;
      expect(n).toBe(LIMITE_CONTACTOS_POR_DIA);
    });
  });

  it("los contactos de ayer no cuentan para el límite de hoy", async () => {
    await enTransaccion(sql, async (tx) => {
      const ofrece = await persona(tx, "Rubén", "5493425111111");
      const pide = await persona(tx, "Ana", "5493425222222");
      const pub = await publicacion(tx, ofrece);
      for (let i = 0; i < LIMITE_CONTACTOS_POR_DIA; i++) {
        await tx`
          insert into contactos (publicacion_id, persona_solicitante_id, creada_en)
          values (${pub}, ${pide}, now() - interval '1 day')`;
      }
      const [fila] = await registrar(tx, pub, pide);
      expect(fila.limite_alcanzado).toBe(false);
    });
  });

  it("no se puede contactar una publicación cerrada o en revisión", async () => {
    await enTransaccion(sql, async (tx) => {
      const ofrece = await persona(tx, "Rubén", "5493425111111");
      const pide = await persona(tx, "Ana", "5493425222222");
      for (const estado of ["cerrada", "en_revision", "archivada"]) {
        const pub = await publicacion(tx, ofrece, estado);
        await tx`savepoint s`;
        await expect(registrar(tx, pub, pide), estado).rejects.toThrow(/no está disponible/);
        await tx`rollback to savepoint s`;
      }
    });
  });
});
