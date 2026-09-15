import postgres from "postgres";

// Conexión directa al Postgres de Supabase local, solo para tests.
// La app nunca usa esta conexión: accede con supabase-js y la service role.
export const DB_URL_LOCAL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export function conectar() {
  return postgres(process.env.TEST_DB_URL ?? DB_URL_LOCAL, { max: 1, onnotice: () => {} });
}

class Rollback extends Error {}

/** Corre `fn` dentro de una transacción que siempre se deshace: los tests no dejan filas. */
export async function enTransaccion(
  sql: postgres.Sql,
  fn: (tx: postgres.TransactionSql) => Promise<void>,
) {
  try {
    await sql.begin(async (tx) => {
      await fn(tx);
      throw new Rollback();
    });
  } catch (e) {
    if (!(e instanceof Rollback)) throw e;
  }
}
