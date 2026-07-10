import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { withApiRoute } from "@/lib/logger";

export const DELETE = withApiRoute(
  "members.revoke",
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
  ) => {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot revoke your own access" },
      { status: 400 },
    );
  }

  const [target] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(
      and(
        eq(users.id, id),
        eq(users.organizationId, session.organization.id),
      ),
    )
    .limit(1);

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "ADMIN") {
    return NextResponse.json(
      { error: "Admin access cannot be revoked" },
      { status: 400 },
    );
  }

  await db.delete(users).where(eq(users.id, id));

  return NextResponse.json({ success: true });
  },
);
