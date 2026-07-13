import { defineConfig } from "drizzle-kit";

function getMigrationDatabaseUrl() {
  const connectionString =
    process.env.DATABASE_URL_DIRECT?.trim() ||
    process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error("DATABASE_URL (or DATABASE_URL_DIRECT) is required");
  }

  return connectionString
    .replace("-pooler", "")
    .replace(/([?&])channel_binding=require(?=&|$)/, "$1")
    .replace(/[?&]$/, "");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getMigrationDatabaseUrl(),
  },
});
