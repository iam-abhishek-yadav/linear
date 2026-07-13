import dns from "node:dns/promises";

/**
 * Neon pooled URLs (`-pooler` hostname) are for app runtime.
 * Migrations need a direct connection.
 */
export function getMigrationConnectionString() {
  const connectionString =
    process.env.DATABASE_URL_DIRECT?.trim() ||
    process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    console.error("DATABASE_URL (or DATABASE_URL_DIRECT) is required");
    process.exit(1);
  }

  return connectionString
    .replace("-pooler", "")
    .replace(/([?&])channel_binding=require(?=&|$)/, "$1")
    .replace(/[?&]$/, "");
}

function parsePostgresUrl(connectionString) {
  const url = new URL(connectionString.replace(/^postgresql:/, "http:"));
  return {
    hostname: url.hostname,
    port: url.port || "5432",
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    search: url.search,
  };
}

/**
 * Resolve Neon to IPv4 and keep SNI for TLS. Avoids flaky dual-stack
 * connect attempts (ENETUNREACH on IPv6 + ETIMEDOUT on IPv4).
 */
export async function createMigrationPool(pg, connectionString) {
  const isNeon = connectionString.includes("neon.tech");

  if (!isNeon) {
    return new pg.Pool({
      connectionString,
      connectionTimeoutMillis: 20_000,
    });
  }

  const parsed = parsePostgresUrl(connectionString);
  const { address } = await dns.lookup(parsed.hostname, { family: 4 });

  return new pg.Pool({
    host: address,
    port: Number(parsed.port),
    user: parsed.username,
    password: parsed.password,
    database: parsed.database,
    connectionTimeoutMillis: 20_000,
    ssl: {
      rejectUnauthorized: true,
      servername: parsed.hostname,
    },
  });
}
