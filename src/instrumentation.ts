export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { db, initDbPool } = await import("@/lib/db");
  const { sql } = await import("drizzle-orm");

  try {
    await initDbPool();
    await db.execute(sql`SELECT 1`);
  } catch {
    // Pool warmup is best-effort; the first real request will still connect.
  }
}
