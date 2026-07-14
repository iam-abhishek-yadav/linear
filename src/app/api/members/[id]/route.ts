import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { UserRole } from "@/db/schema";
import { users } from "@/db/schema";
import {
  requireAdminOrResponse,
  requireMemberManagerOrResponse,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { withApiRoute } from "@/lib/logger";
import { canRevokeMember } from "@/lib/roles";
import { updateMemberRoleSchema, zodErrorResponse } from "@/lib/validations";

export const PATCH = withApiRoute(
  "members.updateRole",
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const guard = await requireAdminOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateMemberRoleSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const nextRole = parsed.data.role as UserRole;

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

    if (target.role === nextRole) {
      return NextResponse.json({
        member: { id: target.id, role: target.role },
      });
    }

    if (target.role === "ADMIN" && nextRole !== "ADMIN") {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(
          and(
            eq(users.organizationId, session.organization.id),
            eq(users.role, "ADMIN"),
          ),
        );

      if (count <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last admin" },
          { status: 400 },
        );
      }
    }

    const [updated] = await db
      .update(users)
      .set({ role: nextRole, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id, role: users.role });

    return NextResponse.json({ member: updated });
  },
);

export const DELETE = withApiRoute(
  "members.revoke",
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const guard = await requireMemberManagerOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;

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

    if (!canRevokeMember(session.user.role, target.role)) {
      return NextResponse.json(
        { error: "You cannot revoke this member's access" },
        { status: 403 },
      );
    }

    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  },
);
