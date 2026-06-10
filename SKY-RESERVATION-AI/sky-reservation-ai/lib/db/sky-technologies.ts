/**
 * Isolated Postgres client for the Sky Technologies external database.
 *
 * Rules:
 *  - NEVER import Supabase clients here — contexts must not mix.
 *  - NEVER use `any` — every query helper is fully typed via generics.
 *  - Pool is created once per Node.js process (singleton).
 *
 * Usage:
 *   const rows = await querySkyDb<{ id: string; name: string }>(
 *     "SELECT id, name FROM businesses WHERE active = $1",
 *     [true]
 *   );
 *
 *   // Or for transactions:
 *   const result = await withSkyDb(async (client) => {
 *     await client.query("BEGIN");
 *     const { rows } = await client.query("INSERT INTO ...");
 *     await client.query("COMMIT");
 *     return rows[0];
 *   });
 *
 * Required env var:
 *   SKY_TECHNOLOGIES_DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
 */

import { Pool, type PoolClient } from "pg";

let _pool: Pool | undefined;

function getSkyPool(): Pool {
  if (_pool) return _pool;

  const url = process.env.SKY_TECHNOLOGIES_DATABASE_URL;
  if (!url) {
    throw new Error(
      "[sky-db] SKY_TECHNOLOGIES_DATABASE_URL is not set. " +
      "Add it to .env.local: postgresql://user:pass@host:5432/dbname?sslmode=require"
    );
  }

  _pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: true },
    max: 10,                      // Max concurrent connections per worker
    idleTimeoutMillis: 30_000,    // Release idle connections after 30s
    connectionTimeoutMillis: 5_000,
  });

  _pool.on("error", (err: Error) => {
    console.error("[sky-db] Unexpected pool error:", err.message);
  });

  return _pool;
}

/**
 * Acquires a client from the pool, runs `fn`, and releases the client.
 * Use this for transactions or when you need multiple queries on the same connection.
 */
export async function withSkyDb<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getSkyPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/**
 * Runs a single parameterized query and returns typed rows.
 * Safe against SQL injection — always use $1, $2... placeholders for user input.
 *
 * @example
 * const tenants = await querySkyDb<{ id: string; slug: string }>(
 *   "SELECT id, slug FROM sky_tenants WHERE status = $1 LIMIT $2",
 *   ["active", 100]
 * );
 */
export async function querySkyDb<TRow extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<TRow[]> {
  return withSkyDb(async (client) => {
    const result = await client.query<TRow>(sql, params);
    return result.rows;
  });
}

/**
 * Runs a query and returns the first row, or null if no rows found.
 */
export async function querySkyDbOne<TRow extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<TRow | null> {
  const rows = await querySkyDb<TRow>(sql, params);
  return rows[0] ?? null;
}

/**
 * Returns true if a row matching the query exists.
 */
export async function skyDbExists(
  sql: string,
  params: unknown[] = []
): Promise<boolean> {
  const row = await querySkyDbOne<{ exists: boolean }>(
    `SELECT EXISTS(${sql}) AS exists`,
    params
  );
  return row?.exists === true;
}
