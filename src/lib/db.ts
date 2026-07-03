import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { getEnv } from "@/lib/env";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

function createPool() {
  return new Pool({
    connectionString: getEnv().DATABASE_URL,
  });
}

const pool = globalForDb.pool ?? createPool();

if (getEnv().NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });
