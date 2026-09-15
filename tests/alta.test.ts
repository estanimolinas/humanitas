import { createHash } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { validarAlta, volverSeguro, type CamposAlta } from "@/lib/alta";
import { buscarPersonaPorToken, registrarPersona } from "@/lib/personas";
import { DURACION_SESION_SEGUNDOS, generarToken, hashToken, opcionesCookieSesion } from "@/lib/sesion/token";
import { conectar } from "./db";

const sql = conectar();
afterAll(() => sql.end());

const camposOk: CamposAlta = {
  nombre: "  Ana   María ",
  telefono: "342 15 512 3456",
  zonaId: "",
  terminos: true,
  mayorDeEdad: true,
};

/** Los tests de alta usan supabase-js (no se puede envolver en transacción): números al azar de un
 *  rango reservado para tests. `supabase db reset` los limpia. */
const telefonoDePrueba = () => `549342999${String(Math.floor(Math.random() * 1e4)).padStart(4, "0")}`;

describe("validarAlta (7.5)", () => {
  it("acepta el alta mínima y normaliza nombre y teléfono", () => {
    expect(validarAlta(camposOk)).toEqual({
      ok: true,
      datos: { nombre: "Ana María", telefono: "5493425123456", telefonoLegible: "342 512 3456", zonaId: null },
    });
  });

  it("zona es opcional", () => {
    const r = validarAlta({ ...camposOk, zonaId: "3" });
    expect(r.ok && r.datos.zonaId).toBe(3);
  });

  it("exige nombre, teléfono con característica, términos y mayoría de edad (R16)", () => {
    const r = validarAlta({ nombre: " ", telefono: "512 3456", zonaId: "", terminos: false, mayorDeEdad: false });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errores).sort()).toEqual(["mayorDeEdad", "nombre", "telefono", "terminos"]);
    }
  });
});

describe("volverSeguro", () => {
  it.each([
    ["/p/123/contactar", "/p/123/contactar"],
    ["/publicar?paso=3", "/publicar?paso=3"],
    ["https://otro.sitio", "/"],
    ["//otro.sitio", "/"],
    ["/\\otro.sitio", "/"],
    [undefined, "/"],
    [["/a", "/b"], "/"],
  ])("%j → %s", (entrada, esperado) => {
    expect(volverSeguro(entrada)).toBe(esperado);
  });
});

describe("token de sesión", () => {
  it("es largo, aleatorio y en la base se guarda solo su hash SHA-256", () => {
    const a = generarToken();
    const b = generarToken();
    expect(a).not.toBe(b);
    expect(Buffer.from(a, "base64url")).toHaveLength(32);
    expect(hashToken(a)).toBe(createHash("sha256").update(a).digest("hex"));
    expect(hashToken(a)).not.toContain(a);
  });

  it("R11: cookie httpOnly, de larga duración (más de una semana)", () => {
    const o = opcionesCookieSesion();
    expect(o).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(o.maxAge).toBe(DURACION_SESION_SEGUNDOS);
    expect(o.maxAge).toBeGreaterThan(7 * 24 * 60 * 60);
  });
});

describe("registrarPersona contra Supabase local", () => {
  it("crea la persona con token hasheado, términos y mayoría de edad, y la encuentra por token", async () => {
    const telefono = telefonoDePrueba();
    const r = await registrarPersona({ nombre: "Test Alta", telefono, zonaId: null });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const [fila] = await sql`
      select token_hash, terminos_aceptados_en, mayoria_edad_declarada, es_operador
      from personas where telefono = ${telefono}`;
    expect(fila.token_hash).toBe(hashToken(r.token));
    expect(fila.token_hash).not.toBe(r.token);
    expect(fila.terminos_aceptados_en).toBeInstanceOf(Date);
    expect(fila.mayoria_edad_declarada).toBe(true);
    expect(fila.es_operador).toBe(false);

    const persona = await buscarPersonaPorToken(r.token);
    expect(persona).toMatchObject({ nombre: "Test Alta", esOperador: false });
  });

  it("R05: lo que devuelve la sesión no incluye el teléfono", async () => {
    const telefono = telefonoDePrueba();
    const r = await registrarPersona({ nombre: "Sin Teléfono", telefono, zonaId: null });
    if (!r.ok) throw new Error("no se pudo registrar");
    const persona = await buscarPersonaPorToken(r.token);
    expect(Object.keys(persona ?? {}).sort()).toEqual(["esOperador", "id", "nombre", "zonaId"]);
    expect(JSON.stringify(r.persona)).not.toContain(telefono.slice(3));
    expect(JSON.stringify(persona)).not.toContain(telefono.slice(3));
  });

  it("8.5 / F1: un teléfono ya registrado no crea otra cuenta", async () => {
    const telefono = telefonoDePrueba();
    await registrarPersona({ nombre: "Primera", telefono, zonaId: null });
    const r = await registrarPersona({ nombre: "Segunda", telefono, zonaId: null });
    expect(r).toEqual({ ok: false, motivo: "telefono_existente" });
  });

  it("un token inventado no identifica a nadie", async () => {
    expect(await buscarPersonaPorToken(generarToken())).toBeNull();
  });
});
