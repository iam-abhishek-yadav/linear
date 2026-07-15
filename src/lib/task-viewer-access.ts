import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  projectAccessRequests,
  projects,
  tasks,
  type ProjectAccessRequestStatus,
} from "@/db/schema";
import { db } from "@/lib/db";
import { canAccessTaskProject } from "@/lib/project-access";

export type ProjectAccessDeniedPayload = {
  error: "PROJECT_ACCESS_REQUIRED";
  project: { id: string; name: string };
  accessRequestStatus: ProjectAccessRequestStatus | null;
};

/**
 * Resolve org-scoped task access for a viewer.
 * - not_found: task missing / wrong org
 * - forbidden: task exists on a project the viewer isn't in
 * - ok: viewer may see/edit the task
 */
export async function resolveTaskViewerAccess(
  organizationId: string,
  taskId: string,
  viewerUserId: string,
): Promise<
  | { status: "not_found" }
  | { status: "forbidden"; payload: ProjectAccessDeniedPayload }
  | { status: "ok"; projectId: string | null }
> {
  const [task] = await db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
    })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)))
    .limit(1);

  if (!task) {
    return { status: "not_found" };
  }

  const allowed = await canAccessTaskProject(viewerUserId, task.projectId);
  if (allowed) {
    return { status: "ok", projectId: task.projectId };
  }

  if (!task.projectId) {
    return { status: "not_found" };
  }

  const [project] = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(
      and(
        eq(projects.id, task.projectId),
        eq(projects.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!project) {
    return { status: "not_found" };
  }

  const [request] = await db
    .select({ status: projectAccessRequests.status })
    .from(projectAccessRequests)
    .where(
      and(
        eq(projectAccessRequests.projectId, project.id),
        eq(projectAccessRequests.userId, viewerUserId),
      ),
    )
    .limit(1);

  return {
    status: "forbidden",
    payload: {
      error: "PROJECT_ACCESS_REQUIRED",
      project: { id: project.id, name: project.name },
      accessRequestStatus: request?.status ?? null,
    },
  };
}

export function projectAccessDeniedResponse(payload: ProjectAccessDeniedPayload) {
  return NextResponse.json(payload, { status: 403 });
}
