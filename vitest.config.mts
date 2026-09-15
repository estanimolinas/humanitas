import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const raiz = (ruta: string) => fileURLToPath(new URL(ruta, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": raiz("."),
      // En tests (Node) no hay límite servidor/cliente de React: se reemplaza por un módulo vacío.
      "server-only": raiz("./tests/vacio.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Los tests de base comparten el Supabase local: sin paralelismo entre archivos.
    fileParallelism: false,
  },
});
