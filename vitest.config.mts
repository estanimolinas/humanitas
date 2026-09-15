import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Los tests de base comparten el Supabase local: sin paralelismo entre archivos.
    fileParallelism: false,
  },
});
