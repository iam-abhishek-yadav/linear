import { asc, eq } from "drizzle-orm";
import { cache } from "react";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logServerCall } from "@/lib/logger";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  isCurrentUser: boolean;
};

async function fetchOrgMembers(
  organizationId: string,
  currentUserId: string,
): Promise<Member[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.organizationId, organizationId))
    .orderBy(asc(users.createdAt));

  return rows.map((member) => ({
    ...member,
    isCurrentUser: member.id === currentUserId,
  }));
}

export const getOrgMembers = cache(() =>
  logServerCall("getOrgMembers", async () => {
    const session = await getCurrentUser();
    if (!session) {
      return [];
    }

    return fetchOrgMembers(session.organization.id, session.user.id);
  }),
);
