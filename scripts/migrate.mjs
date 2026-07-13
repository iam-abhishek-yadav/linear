import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import {
  createMigrationPool,
  getMigrationConnectionString,
} from "./db-connection.mjs";

const connectionString = getMigrationConnectionString();
const pool = await createMigrationPool(pg, connectionString);
const db = drizzle(pool);

try {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrations applied successfully");
} finally {
  await pool.end();
}
