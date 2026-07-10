export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { db } = await import("@/lib/db");
  const { sql } = await import("drizzle-orm");

  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    // Pool warmup is best-effort; the first real request will still connect.
  }
}
