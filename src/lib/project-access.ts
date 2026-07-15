import { and, eq } from "drizzle-orm";
import { projectMembers } from "@/db/schema";
import { db } from "@/lib/db";

/** True when the user is a member of the project. */
export async function isUserProjectMember(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
      ),
    )
    .limit(1);

  return Boolean(row);
}

/**
 * Issues with no project are visible to everyone in the org.
 * Issues on a project require project membership.
 */
export async function canAccessTaskProject(
  userId: string,
  projectId: string | null | undefined,
): Promise<boolean> {
  if (!projectId) return true;
  return isUserProjectMember(userId, projectId);
}

/** Project ids the user belongs to (empty if none). */
export async function listUserProjectIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId));

  return rows.map((row) => row.projectId);
}
