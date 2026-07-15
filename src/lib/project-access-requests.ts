import { createId } from "@paralleldrive/cuid2";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  projectAccessRequests,
  projectMembers,
  projects,
  users,
  type ProjectAccessRequestStatus,
  type UserRole,
} from "@/db/schema";
import { db } from "@/lib/db";
import { canApproveProjectAccess } from "@/lib/roles";

export type ProjectAccessRequestItem = {
  id: string;
  projectId: string;
  projectName: string;
  status: ProjectAccessRequestStatus;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
};

export async function getUserProjectAccessRequest(
  projectId: string,
  userId: string,
) {
  const [row] = await db
    .select({
      id: projectAccessRequests.id,
      status: projectAccessRequests.status,
    })
    .from(projectAccessRequests)
    .where(
      and(
        eq(projectAccessRequests.projectId, projectId),
        eq(projectAccessRequests.userId, userId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getAccessRequestsByProjectIds(
  projectIds: string[],
  userId: string,
): Promise<Map<string, { id: string; status: ProjectAccessRequestStatus }>> {
  const map = new Map<string, { id: string; status: ProjectAccessRequestStatus }>();
  if (projectIds.length === 0) return map;

  const rows = await db
    .select({
      id: projectAccessRequests.id,
      projectId: projectAccessRequests.projectId,
      status: projectAccessRequests.status,
    })
    .from(projectAccessRequests)
    .where(
      and(
        eq(projectAccessRequests.userId, userId),
        inArray(projectAccessRequests.projectId, projectIds),
      ),
    );

  for (const row of rows) {
    map.set(row.projectId, { id: row.id, status: row.status });
  }

  return map;
}

export async function getMemberProjectIds(
  userId: string,
  projectIds: string[],
): Promise<Set<string>> {
  const set = new Set<string>();
  if (projectIds.length === 0) return set;

  const rows = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.userId, userId),
        inArray(projectMembers.projectId, projectIds),
      ),
    );

  for (const row of rows) {
    set.add(row.projectId);
  }
  return set;
}

export async function listPendingAccessRequests(
  organizationId: string,
  actorRole: UserRole,
): Promise<ProjectAccessRequestItem[]> {
  const rows = await db
    .select({
      id: projectAccessRequests.id,
      projectId: projectAccessRequests.projectId,
      projectName: projects.name,
      status: projectAccessRequests.status,
      createdAt: projectAccessRequests.createdAt,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
    })
    .from(projectAccessRequests)
    .innerJoin(projects, eq(projectAccessRequests.projectId, projects.id))
    .innerJoin(users, eq(projectAccessRequests.userId, users.id))
    .where(
      and(
        eq(projects.organizationId, organizationId),
        eq(projectAccessRequests.status, "PENDING"),
      ),
    )
    .orderBy(asc(projectAccessRequests.createdAt));

  return rows
    .filter((row) => canApproveProjectAccess(actorRole, row.userRole))
    .map((row) => ({
      id: row.id,
      projectId: row.projectId,
      projectName: row.projectName,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      user: {
        id: row.userId,
        name: row.userName,
        email: row.userEmail,
        role: row.userRole,
      },
    }));
}

export async function requestProjectAccess({
  organizationId,
  projectId,
  userId,
}: {
  organizationId: string;
  projectId: string;
  userId: string;
}) {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)),
    )
    .limit(1);

  if (!project) {
    return { error: "NOT_FOUND" as const };
  }

  const [existingMember] = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
      ),
    )
    .limit(1);

  if (existingMember) {
    return { error: "ALREADY_MEMBER" as const };
  }

  const existing = await getUserProjectAccessRequest(projectId, userId);

  if (existing?.status === "PENDING") {
    return {
      request: { id: existing.id, status: existing.status as ProjectAccessRequestStatus },
    };
  }

  if (existing?.status === "APPROVED") {
    // Stale approved without membership — allow re-request
  }

  if (existing) {
    const [updated] = await db
      .update(projectAccessRequests)
      .set({
        status: "PENDING",
        reviewedById: null,
        reviewedAt: null,
        createdAt: new Date(),
      })
      .where(eq(projectAccessRequests.id, existing.id))
      .returning({
        id: projectAccessRequests.id,
        status: projectAccessRequests.status,
      });

    return { request: updated! };
  }

  const id = createId();
  await db.insert(projectAccessRequests).values({
    id,
    projectId,
    userId,
    status: "PENDING",
  });

  return { request: { id, status: "PENDING" as const } };
}

export async function reviewProjectAccessRequest({
  organizationId,
  requestId,
  actorId,
  actorRole,
  action,
}: {
  organizationId: string;
  requestId: string;
  actorId: string;
  actorRole: UserRole;
  action: "approve" | "deny";
}) {
  const [row] = await db
    .select({
      id: projectAccessRequests.id,
      projectId: projectAccessRequests.projectId,
      userId: projectAccessRequests.userId,
      status: projectAccessRequests.status,
      userRole: users.role,
      orgId: projects.organizationId,
    })
    .from(projectAccessRequests)
    .innerJoin(projects, eq(projectAccessRequests.projectId, projects.id))
    .innerJoin(users, eq(projectAccessRequests.userId, users.id))
    .where(eq(projectAccessRequests.id, requestId))
    .limit(1);

  if (!row || row.orgId !== organizationId) {
    return { error: "NOT_FOUND" as const };
  }

  if (row.status !== "PENDING") {
    return { error: "NOT_PENDING" as const };
  }

  if (!canApproveProjectAccess(actorRole, row.userRole)) {
    return { error: "FORBIDDEN" as const };
  }

  if (action === "deny") {
    await db
      .update(projectAccessRequests)
      .set({
        status: "DENIED",
        reviewedById: actorId,
        reviewedAt: new Date(),
      })
      .where(eq(projectAccessRequests.id, requestId));

    return { ok: true as const, status: "DENIED" as const };
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(projectMembers)
      .values({
        projectId: row.projectId,
        userId: row.userId,
      })
      .onConflictDoNothing();

    await tx
      .update(projectAccessRequests)
      .set({
        status: "APPROVED",
        reviewedById: actorId,
        reviewedAt: new Date(),
      })
      .where(eq(projectAccessRequests.id, requestId));
  });

  return { ok: true as const, status: "APPROVED" as const };
}
