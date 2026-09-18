import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { esUuid } from "@/lib/ids";
import { CABECERAS_FIJAS, nuevoNonce, origenDe, politicaCsp } from "@/lib/seguridad/cabeceras";
import { hashIp, ipDe, MAXIMOS_POR_DIA } from "@/lib/seguridad/limites";

// Paso 11.5. Estos tests no usan la base: corren aunque Supabase esté apagado.

function archivosDe(dirs: string[], extension = /\.(ts|tsx|js|mjs)$/): string[] {
  const salida: string[] = [];
  const recorrer = (ruta: string) => {
    if (!existsSync(ruta)) return;
    if (statSync(ruta).isDirectory()) {
      for (const e of readdirSync(ruta)) if (e !== "node_modules") recorrer(join(ruta, e));
    } else if (extension.test(ruta)) salida.push(ruta);
  };
  dirs.forEach(recorrer);
  return salida;
}

describe("cabeceras de seguridad (11.5, punto 1)", () => {
  const base = { nonce: "abc123", origenFotos: "https://proyecto.supabase.co" };

  it("solo corren los scripts con el nonce del pedido: nada de inline ni eval en producción", () => {
    const csp = politicaCsp({ ...base, desarrollo: false });
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).toContain("style-src 'self' 'nonce-abc123'");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("en desarrollo permite eval y estilos en línea (los usa el overlay de errores) y no fuerza https", () => {
    const csp = politicaCsp({ ...base, desarrollo: true });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("nadie puede meter la app en un iframe ni cambiar la base de los links", () => {
    const csp = politicaCsp({ ...base, desarrollo: false });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  it("las fotos solo vienen de nuestro Storage; los formularios solo van a la app o a WhatsApp", () => {
    const csp = politicaCsp({ ...base, desarrollo: false });
    expect(csp).toContain("img-src 'self' blob: data: https://proyecto.supabase.co");
    expect(csp).toContain("form-action 'self' https://wa.me https://api.whatsapp.com");
  });

  it("sin origen de fotos válido, no se abre img-src a ningún otro lado", () => {
    expect(origenDe(undefined)).toBeNull();
    expect(origenDe("no es una url")).toBeNull();
    expect(origenDe("http://127.0.0.1:54321/algo")).toBe("http://127.0.0.1:54321");
    expect(politicaCsp({ ...base, origenFotos: null, desarrollo: false })).toContain(
      "img-src 'self' blob: data:;",
    );
  });

  it("el nonce es distinto en cada pedido y difícil de adivinar", () => {
    const nonces = new Set(Array.from({ length: 50 }, nuevoNonce));
    expect(nonces.size).toBe(50);
    for (const n of nonces) expect(atob(n)).toHaveLength(16);
  });

  it("las cabeceras fijas cubren nosniff, anti-iframe, referrer, permisos, HSTS y COOP", () => {
    const claves = CABECERAS_FIJAS.map((c) => c.key);
    expect(claves).toEqual(
      expect.arrayContaining([
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "Strict-Transport-Security",
        "Cross-Origin-Opener-Policy",
      ]),
    );
  });
});

describe("secretos (11.5, punto 5)", () => {
  const codigo = archivosDe(["app", "lib", "scripts", "proxy.ts", "next.config.ts"]);

  it("ninguna variable de entorno usa el prefijo NEXT_PUBLIC_ (iría al navegador)", () => {
    const conPrefijo = codigo.filter((a) => /process\.env\.NEXT_PUBLIC_/.test(readFileSync(a, "utf8")));
    expect(conPrefijo).toEqual([]);
    const ejemplo = readFileSync(".env.example", "utf8")
      .split("\n")
      .filter((l) => !l.trim().startsWith("#"));
    expect(ejemplo.filter((l) => l.startsWith("NEXT_PUBLIC_"))).toEqual([]);
  });

  it("ningún componente del navegador importa código de solo servidor", () => {
    const soloServidor = (ruta: string) => {
      for (const candidato of [`${ruta}.ts`, `${ruta}.tsx`, `${ruta}/index.ts`]) {
        if (existsSync(candidato)) return /^import "server-only";/m.test(readFileSync(candidato, "utf8"));
      }
      return false;
    };
    const problemas: string[] = [];
    for (const archivo of codigo) {
      const fuente = readFileSync(archivo, "utf8");
      if (!/^"use client";/m.test(fuente)) continue;
      // `import type` se borra al compilar: no lleva código al navegador.
      for (const [, destino] of fuente.matchAll(/^import (?!type\b)[^;]*?from "@\/([^"]+)"/gm)) {
        if (soloServidor(destino)) problemas.push(`${archivo} → @/${destino}`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it("todo lo que habla con Supabase es de solo servidor", () => {
    const usanSupabase = archivosDe(["lib"]).filter((a) =>
      /supabaseServidor|@supabase\/supabase-js/.test(readFileSync(a, "utf8")),
    );
    const sinMarca = usanSupabase.filter((a) => !/^import "server-only";/m.test(readFileSync(a, "utf8")));
    expect(sinMarca).toEqual([]);
  });

  it(".env.local nunca se sube a git", () => {
    const ignorado = execSync("git check-ignore .env.local || true", { encoding: "utf8" }).trim();
    expect(ignorado).toBe(".env.local");
    const versionados = execSync("git ls-files", { encoding: "utf8" }).split("\n");
    expect(versionados.filter((f) => /(^|\/)\.env(?!\.example$)/.test(f))).toEqual([]);
  });
});

describe("ids inventados (11.5, punto 2)", () => {
  it("solo pasan los que tienen forma de UUID", () => {
    expect(esUuid("8668e59c-cb73-4619-8145-f5ed11080560")).toBe(true);
    for (const malo of ["", "123", "8668e59c", "'; select 1 --", null, undefined, 42]) {
      expect(esUuid(malo)).toBe(false);
    }
  });
});

describe("límites por conexión: la IP (11.5, punto 3)", () => {
  const cabeceras = (h: Record<string, string>) => ({ get: (n: string) => h[n] ?? null });

  it("toma la IP que pone el servidor y, si no está, la primera de x-forwarded-for", () => {
    expect(ipDe(cabeceras({ "x-real-ip": "190.1.2.3", "x-forwarded-for": "1.1.1.1" }))).toBe("190.1.2.3");
    expect(ipDe(cabeceras({ "x-forwarded-for": "190.1.2.3, 10.0.0.1" }))).toBe("190.1.2.3");
    expect(ipDe(cabeceras({}))).toBe("desconocida");
  });

  it("guarda un SHA-256 con sal: 64 hex, distinto con otra sal, sin la IP adentro", async () => {
    const a = await hashIp("190.1.2.3", "sal-1");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("190");
    expect(await hashIp("190.1.2.3", "sal-2")).not.toBe(a);
    expect(await hashIp("190.1.2.3", "sal-1")).toBe(a);
  });

  it("los máximos no traban un encuentro en un mismo Wi-Fi", () => {
    expect(MAXIMOS_POR_DIA.alta).toBeGreaterThanOrEqual(20);
  });
});

describe("auditoría del 18/09/2026", () => {
  it("volver: solo rutas internas, leídas como las lee el navegador", async () => {
    const { volverSeguro } = await import("@/lib/alta");
    expect(volverSeguro("/p/abc?contactar=1")).toBe("/p/abc?contactar=1");
    expect(volverSeguro("/mis-publicaciones")).toBe("/mis-publicaciones");
    for (const malo of [
      "//otro.sitio",
      "/\\otro.sitio",
      "/\t/otro.sitio",
      "/\n/otro.sitio",
      "https://otro.sitio",
      "javascript:alert(1)",
      "",
      null,
    ]) {
      expect(volverSeguro(malo), JSON.stringify(malo)).toBe("/");
    }
  });

  it("la foto se reconoce por su contenido, no por el tipo que declara el navegador", async () => {
    const { tipoPorContenido } = await import("@/lib/publicar");
    const bytes = (...b: number[]) => new Uint8Array(b);
    const texto = (s: string) => new TextEncoder().encode(s);
    expect(tipoPorContenido(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(tipoPorContenido(texto("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(tipoPorContenido(texto("<html><script>"))).toBeNull();
    expect(tipoPorContenido(texto("GIF89a"))).toBeNull();
  });
});
