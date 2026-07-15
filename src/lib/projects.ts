import { createId } from "@paralleldrive/cuid2";
import { and, asc, eq, inArray } from "drizzle-orm";
import { projectMembers, projects, users } from "@/db/schema";
import { db, isUniqueViolationError } from "@/lib/db";

export type ProjectMemberSummary = {
  id: string;
  name: string;
  email: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  members: ProjectMemberSummary[];
};

function toProjectSummary(
  project: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  members: ProjectMemberSummary[],
): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    members,
  };
}

async function assertMembersInOrganization(
  organizationId: string,
  memberIds: string[],
) {
  const uniqueIds = [...new Set(memberIds)];
  if (uniqueIds.length === 0) {
    return [];
  }

  const validMembers = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(eq(users.organizationId, organizationId), inArray(users.id, uniqueIds)),
    );

  if (validMembers.length !== uniqueIds.length) {
    throw new Error("INVALID_PROJECT_MEMBERS");
  }

  return uniqueIds;
}

async function getMembersForProjectIds(
  projectIds: string[],
): Promise<Map<string, ProjectMemberSummary[]>> {
  const map = new Map<string, ProjectMemberSummary[]>();

  if (projectIds.length === 0) {
    return map;
  }

  const rows = await db
    .select({
      projectId: projectMembers.projectId,
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(inArray(projectMembers.projectId, projectIds))
    .orderBy(asc(users.name));

  for (const row of rows) {
    const current = map.get(row.projectId) ?? [];
    current.push({ id: row.id, name: row.name, email: row.email });
    map.set(row.projectId, current);
  }

  return map;
}

export async function getOrganizationProject(
  organizationId: string,
  projectId: string,
) {
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)),
    )
    .limit(1);

  return project ?? null;
}

export async function listOrgProjects(
  organizationId: string,
): Promise<ProjectSummary[]> {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.organizationId, organizationId))
    .orderBy(asc(projects.name));

  const membersByProjectId = await getMembersForProjectIds(rows.map((p) => p.id));

  return rows.map((project) =>
    toProjectSummary(project, membersByProjectId.get(project.id) ?? []),
  );
}

export async function getOrgProject(
  organizationId: string,
  projectId: string,
): Promise<ProjectSummary | null> {
  const project = await getOrganizationProject(organizationId, projectId);
  if (!project) {
    return null;
  }

  const membersByProjectId = await getMembersForProjectIds([project.id]);

  return toProjectSummary(
    project,
    membersByProjectId.get(project.id) ?? [],
  );
}

export async function createOrgProject({
  organizationId,
  name,
  description,
  memberIds = [],
}: {
  organizationId: string;
  name: string;
  description?: string;
  memberIds?: string[];
}): Promise<ProjectSummary> {
  const normalizedName = name.trim();
  const normalizedDescription = description?.trim() || null;
  const validMemberIds = await assertMembersInOrganization(
    organizationId,
    memberIds,
  );
  const id = createId();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(projects).values({
        id,
        organizationId,
        name: normalizedName,
        description: normalizedDescription,
      });

      if (validMemberIds.length > 0) {
        await tx.insert(projectMembers).values(
          validMemberIds.map((userId) => ({
            projectId: id,
            userId,
          })),
        );
      }
    });
  } catch (error) {
    if (isUniqueViolationError(error)) {
      throw new Error("DUPLICATE_PROJECT");
    }
    throw error;
  }

  const created = await getOrgProject(organizationId, id);
  if (!created) {
    throw new Error("Failed to load created project");
  }
  return created;
}

export async function updateOrgProject({
  organizationId,
  projectId,
  name,
  description,
}: {
  organizationId: string;
  projectId: string;
  name?: string;
  description?: string | null;
}): Promise<ProjectSummary | null> {
  const existing = await getOrganizationProject(organizationId, projectId);
  if (!existing) {
    return null;
  }

  const updates: {
    name?: string;
    description?: string | null;
  } = {};

  if (name !== undefined) {
    updates.name = name.trim();
  }
  if (description !== undefined) {
    updates.description =
      description === null ? null : description.trim() || null;
  }

  if (Object.keys(updates).length > 0) {
    try {
      await db
        .update(projects)
        .set(updates)
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.organizationId, organizationId),
          ),
        );
    } catch (error) {
      if (isUniqueViolationError(error)) {
        throw new Error("DUPLICATE_PROJECT");
      }
      throw error;
    }
  }

  return getOrgProject(organizationId, projectId);
}

export async function deleteOrgProject(
  organizationId: string,
  projectId: string,
) {
  const result = await db
    .delete(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
      ),
    )
    .returning({ id: projects.id });

  return result.length > 0;
}

export async function setProjectMembers({
  organizationId,
  projectId,
  memberIds,
}: {
  organizationId: string;
  projectId: string;
  memberIds: string[];
}): Promise<ProjectSummary | null> {
  const existing = await getOrganizationProject(organizationId, projectId);
  if (!existing) {
    return null;
  }

  const validMemberIds = await assertMembersInOrganization(
    organizationId,
    memberIds,
  );

  await db.transaction(async (tx) => {
    await tx
      .delete(projectMembers)
      .where(eq(projectMembers.projectId, projectId));

    if (validMemberIds.length > 0) {
      await tx.insert(projectMembers).values(
        validMemberIds.map((userId) => ({
          projectId,
          userId,
        })),
      );
    }
  });

  return getOrgProject(organizationId, projectId);
}
