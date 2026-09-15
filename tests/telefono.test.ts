import { describe, expect, it } from "vitest";
import { normalizarTelefono } from "@/lib/telefono";

describe("normalizarTelefono", () => {
  it.each([
    ["342 512 3456", "5493425123456"],
    ["3425123456", "5493425123456"],
    ["0342 512-3456", "5493425123456"],
    ["342 15 512 3456", "5493425123456"],
    ["0342 155123456", "5493425123456"],
    ["+54 9 342 512 3456", "5493425123456"],
    ["+54 342 512 3456", "5493425123456"],
    ["5493425123456", "5493425123456"],
    ["0054 9 342 5123456", "5493425123456"],
    ["(0342) 15-512-3456", "5493425123456"],
    ["11 15 2345 6789", "5491123456789"],
  ])("%s → %s", (entrada, esperado) => {
    const r = normalizarTelefono(entrada);
    expect(r).toMatchObject({ ok: true, normalizado: esperado });
  });

  it("muestra el número legible para confirmar", () => {
    expect(normalizarTelefono("0342 15 512 3456")).toMatchObject({ legible: "342 512 3456" });
  });

  it("NO asume característica: sin ella pide que la escriban (decisión 15/09)", () => {
    for (const sinCaracteristica of ["512 3456", "15 512 3456", "4512345"]) {
      const r = normalizarTelefono(sinCaracteristica);
      expect(r.ok, sinCaracteristica).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/Falta la característica/);
    }
  });

  it.each(["", "abc", "342 512 34567 89", "942 512 3456"])("rechaza %j", (entrada) => {
    expect(normalizarTelefono(entrada).ok).toBe(false);
  });
});
