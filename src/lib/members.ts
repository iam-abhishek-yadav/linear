import { asc, eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  isCurrentUser: boolean;
};

export async function getOrgMembers(): Promise<Member[]> {
  const session = await requireUser();
  if (!session) {
    return [];
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.organizationId, session.organization.id))
    .orderBy(asc(users.createdAt));

  return rows.map((member) => ({
    ...member,
    isCurrentUser: member.id === session.user.id,
  }));
}
