import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { getEnv } from "@/lib/env";

type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
  db: Database | undefined;
};

function getPool(): Pool {
  if (!globalForDb.pool) {
    const pool = new Pool({
      connectionString: getEnv().DATABASE_URL,
      // Keep TCP connections alive so idle sockets aren't silently dropped
      // by the server/NAT, which otherwise surfaces as ETIMEDOUT on reuse.
      keepAlive: true,
      // Fail fast instead of hanging when a new connection can't be established.
      connectionTimeoutMillis: 10_000,
      // Recycle idle connections before a remote host is likely to drop them.
      idleTimeoutMillis: 30_000,
      max: 10,
    });

    // Idle clients can emit errors (e.g. dropped connection) outside of a
    // query; handle them so a background failure doesn't crash the process.
    // The pool removes the broken client automatically.
    pool.on("error", (err) => {
      console.error("Unexpected error on idle database client", err);
    });

    globalForDb.pool = pool;
  }
  return globalForDb.pool;
}

function getDb(): Database {
  if (!globalForDb.db) {
    globalForDb.db = drizzle(getPool(), { schema });
  }
  return globalForDb.db;
}

// Defer env/pool access until the first query so `next build` works without DATABASE_URL.
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

const RETRYABLE_DB_ERROR_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EPIPE",
  "57P01", // admin_shutdown
  "08006", // connection_failure
  "08003", // connection_does_not_exist
]);

function isRetryableDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const codes = new Set<string>();
  const collect = (e: unknown) => {
    if (!e || typeof e !== "object") return;
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string") codes.add(code);
    const errors = (e as { errors?: unknown }).errors;
    if (Array.isArray(errors)) errors.forEach(collect);
    const cause = (e as { cause?: unknown }).cause;
    if (cause) collect(cause);
  };
  collect(error);
  return [...codes].some((code) => RETRYABLE_DB_ERROR_CODES.has(code));
}

export function isDbConnectionError(error: unknown): boolean {
  return isRetryableDbError(error);
}

/**
 * Run a database operation, retrying once on transient connection errors.
 * Guards against a stale pooled connection turning a request into a hard 500.
 */
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isRetryableDbError(error)) throw error;
    return fn();
  }
}
