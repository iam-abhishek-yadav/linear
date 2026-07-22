import { spawnSync } from "node:child_process";
import { lookup } from "node:dns/promises";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { getEnv } from "@/lib/env";

type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
  poolPromise: Promise<Pool> | undefined;
  db: Database | undefined;
};

function parsePostgresUrl(connectionString: string) {
  const url = new URL(connectionString.replace(/^postgresql:/, "http:"));
  return {
    hostname: url.hostname,
    port: url.port || "5432",
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
}

const POOL_COMMON = {
  // Keep TCP connections alive so idle sockets aren't silently dropped
  // by the server/NAT, which otherwise surfaces as ETIMEDOUT on reuse.
  keepAlive: true,
  // Fail fast instead of hanging when a new connection can't be established.
  connectionTimeoutMillis: 10_000,
  // Recycle idle connections before a remote host is likely to drop them.
  idleTimeoutMillis: 30_000,
  max: 10,
} as const;

/**
 * Neon hostnames resolve to both IPv4 and IPv6. On many local networks IPv6
 * is unreachable, and node-postgres fails with ETIMEDOUT even though IPv4
 * works (Vercel usually does not hit this). Connect via IPv4 and keep SNI.
 */
function resolveIpv4Sync(hostname: string): string {
  const getent = spawnSync("getent", ["ahostsv4", hostname], {
    encoding: "utf8",
    timeout: 10_000,
  });
  if (getent.status === 0 && getent.stdout) {
    const match = getent.stdout.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/);
    if (match) return match[1];
  }

  const node = spawnSync(
    process.execPath,
    [
      "-e",
      `require("node:dns").resolve4(${JSON.stringify(hostname)},(e,a)=>{if(e||!a?.[0]){process.stderr.write(String(e||"no addresses"));process.exit(1)}process.stdout.write(a[0])})`,
    ],
    { encoding: "utf8", timeout: 10_000 },
  );
  const address = node.stdout?.trim();
  if (node.status !== 0 || !address) {
    throw new Error(
      `Failed to resolve ${hostname} to IPv4: ${node.stderr || getent.stderr || "unknown error"}`,
    );
  }
  return address;
}

function createPoolWithHost(address: string, hostname: string, connectionString: string) {
  const parsed = parsePostgresUrl(connectionString);
  const pool = new Pool({
    host: address,
    port: Number(parsed.port),
    user: parsed.username,
    password: parsed.password,
    database: parsed.database,
    ssl: {
      rejectUnauthorized: true,
      servername: hostname,
    },
    ...POOL_COMMON,
  });

  pool.on("error", (err) => {
    console.error("Unexpected error on idle database client", err);
  });

  return pool;
}

function createPoolSync(): Pool {
  const connectionString = getEnv().DATABASE_URL;
  const isNeon = connectionString.includes("neon.tech");

  if (!isNeon) {
    const pool = new Pool({
      connectionString,
      ...POOL_COMMON,
    });
    pool.on("error", (err) => {
      console.error("Unexpected error on idle database client", err);
    });
    return pool;
  }

  const { hostname } = parsePostgresUrl(connectionString);
  return createPoolWithHost(resolveIpv4Sync(hostname), hostname, connectionString);
}

async function createPoolAsync(): Promise<Pool> {
  const connectionString = getEnv().DATABASE_URL;
  const isNeon = connectionString.includes("neon.tech");

  if (!isNeon) {
    return createPoolSync();
  }

  const { hostname } = parsePostgresUrl(connectionString);
  const { address } = await lookup(hostname, { family: 4 });
  return createPoolWithHost(address, hostname, connectionString);
}

/** Prefer calling this from instrumentation so the first request doesn't block on DNS. */
export async function initDbPool(): Promise<Pool> {
  if (globalForDb.pool) return globalForDb.pool;
  if (!globalForDb.poolPromise) {
    globalForDb.poolPromise = createPoolAsync()
      .then((pool) => {
        globalForDb.pool = pool;
        return pool;
      })
      .catch((error) => {
        globalForDb.poolPromise = undefined;
        throw error;
      });
  }
  return globalForDb.poolPromise;
}

function getPool(): Pool {
  if (!globalForDb.pool) {
    globalForDb.pool = createPoolSync();
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

/** True for a Postgres unique-constraint violation (error code 23505). */
export function isUniqueViolationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as { code?: unknown }).code === "23505";
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
