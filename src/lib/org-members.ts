import { and, eq, inArray } from "drizzle-orm";
import { users } from "@/db/schema";
import { db } from "@/lib/db";

/** Return the subset of userIds that belong to the organization. */
export async function filterOrgMemberIds(
  organizationId: string,
  userIds: string[],
): Promise<string[]> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return [];

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        inArray(users.id, unique),
      ),
    );

  return rows.map((row) => row.id);
}
