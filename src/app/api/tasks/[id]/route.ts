import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { tasks } from "@/db/schema";
import { requireUserOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createAssignmentNotification,
  createStatusChangeNotification,
} from "@/lib/notifications";
import {
  recordTaskAssigneeChange,
  recordTaskDueDateChange,
  recordTaskPriorityChange,
  recordTaskStatusChange,
} from "@/lib/task-activity";
import { isProjectInOrganization } from "@/lib/projects";
import { canAccessTaskProject } from "@/lib/project-access";
import {
  getOrganizationTask,
  isAssigneeInOrganization,
} from "@/lib/task-access";
import { getOrganizationTaskWithTags } from "@/lib/tasks";
import { getTagsForTask } from "@/lib/tags";
import {
  projectAccessDeniedResponse,
  resolveTaskViewerAccess,
} from "@/lib/task-viewer-access";
import { resolveCompletedAtUpdate } from "@/lib/task-visibility";
import { updateTaskSchema, zodErrorResponse } from "@/lib/validations";
import { withApiRoute } from "@/lib/logger";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withApiRoute(
  "tasks.get",
  async (_request: Request, context: RouteContext) => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const { id } = await context.params;
  const access = await resolveTaskViewerAccess(
    session.organization.id,
    id,
    session.user.id,
  );

  if (access.status === "not_found") {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (access.status === "forbidden") {
    return projectAccessDeniedResponse(access.payload);
  }

  const task = await getOrganizationTaskWithTags(
    session.organization.id,
    id,
    session.user.id,
  );

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
  },
);

export const PATCH = withApiRoute(
  "tasks.update",
  async (request: Request, context: RouteContext) => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const organizationId = session.organization.id;
  const existing = await getOrganizationTask(organizationId, id, session.user.id);

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (parsed.data.assigneeId !== undefined) {
    const assigneeOk = await isAssigneeInOrganization(
      parsed.data.assigneeId,
      organizationId,
    );
    if (!assigneeOk) {
      return NextResponse.json(
        { error: "Assignee must be a member of your organization" },
        { status: 400 },
      );
    }
  }

  if (parsed.data.projectId !== undefined) {
    const projectOk = await isProjectInOrganization(
      parsed.data.projectId,
      organizationId,
    );
    if (!projectOk) {
      return NextResponse.json(
        { error: "Project must belong to your organization" },
        { status: 400 },
      );
    }
    const projectAccessOk = await canAccessTaskProject(
      session.user.id,
      parsed.data.projectId,
    );
    if (!projectAccessOk) {
      return NextResponse.json(
        { error: "You must be a member of the project" },
        { status: 403 },
      );
    }
  }

  const nextStatus = parsed.data.status ?? existing.status;
  const nextPriority = parsed.data.priority ?? existing.priority;
  const nextAssigneeId =
    parsed.data.assigneeId !== undefined
      ? parsed.data.assigneeId
      : existing.assigneeId;
  const nextDueDate =
    parsed.data.dueDate !== undefined ? parsed.data.dueDate : existing.dueDate;
  const completedAt = resolveCompletedAtUpdate(existing.status, nextStatus);
  const updatePayload = {
    ...parsed.data,
    ...(completedAt !== undefined ? { completedAt } : {}),
  };

  const [task] = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(tasks)
      .set(updatePayload)
      .where(
        and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)),
      )
      .returning();

    const actorId = session.user.id;

    if (parsed.data.status && parsed.data.status !== existing.status) {
      await recordTaskStatusChange(tx, {
        taskId: id,
        userId: actorId,
        fromStatus: existing.status,
        toStatus: nextStatus,
      });
      await createStatusChangeNotification(tx, {
        assigneeId: nextAssigneeId,
        actorId,
        taskId: id,
      });
    }

    const assigneeChanged =
      parsed.data.assigneeId !== undefined &&
      parsed.data.assigneeId !== existing.assigneeId;

    if (assigneeChanged) {
      await recordTaskAssigneeChange(tx, {
        taskId: id,
        userId: actorId,
        fromAssigneeId: existing.assigneeId,
        toAssigneeId: parsed.data.assigneeId ?? null,
      });

      if (parsed.data.assigneeId) {
        await createAssignmentNotification(tx, {
          recipientId: parsed.data.assigneeId,
          actorId,
          taskId: id,
        });
      }
    }

    if (parsed.data.priority && parsed.data.priority !== existing.priority) {
      await recordTaskPriorityChange(tx, {
        taskId: id,
        userId: actorId,
        fromPriority: existing.priority,
        toPriority: nextPriority,
      });
    }

    if (parsed.data.dueDate !== undefined) {
      await recordTaskDueDateChange(tx, {
        taskId: id,
        userId: actorId,
        fromDueDate: existing.dueDate,
        toDueDate: nextDueDate ?? null,
      });
    }

    return [updated];
  });

  const tags = await getTagsForTask(id);
  return NextResponse.json({ ...task, tags });
  },
);

export const DELETE = withApiRoute(
  "tasks.delete",
  async (_request: Request, context: RouteContext) => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const { id } = await context.params;
  const organizationId = session.organization.id;

  const existing = await getOrganizationTask(organizationId, id, session.user.id);

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)));

  return NextResponse.json({ success: true });
  },
);
