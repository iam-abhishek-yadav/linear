import { and, eq, max } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { NextResponse } from "next/server";
import { tasks } from "@/db/schema";
import { requireUserOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { withApiRoute } from "@/lib/logger";
import { createAssignmentNotification } from "@/lib/notifications";
import { recordTaskCreated } from "@/lib/task-activity";
import { isProjectInOrganization } from "@/lib/projects";
import { canAccessTaskProject } from "@/lib/project-access";
import { isAssigneeInOrganization } from "@/lib/task-access";
import { getOrgTasks } from "@/lib/tasks";
import { getTagsForTask } from "@/lib/tags";
import { createTaskSchema, zodErrorResponse } from "@/lib/validations";

export const GET = withApiRoute("tasks.list", async () => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;

  return NextResponse.json(await getOrgTasks());
});

export const POST = withApiRoute("tasks.create", async (request: Request) => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const organizationId = session.organization.id;
  const status = parsed.data.status ?? "BACKLOG";
  const assigneeId = parsed.data.assigneeId ?? null;
  const projectId = parsed.data.projectId ?? null;

  const assigneeOk = await isAssigneeInOrganization(
    assigneeId,
    organizationId,
  );
  if (!assigneeOk) {
    return NextResponse.json(
      { error: "Assignee must be a member of your organization" },
      { status: 400 },
    );
  }

  const projectOk = await isProjectInOrganization(projectId, organizationId);
  if (!projectOk) {
    return NextResponse.json(
      { error: "Project must belong to your organization" },
      { status: 400 },
    );
  }

  const projectAccessOk = await canAccessTaskProject(
    session.user.id,
    projectId,
  );
  if (!projectAccessOk) {
    return NextResponse.json(
      { error: "You must be a member of the project" },
      { status: 403 },
    );
  }

  const [maxPos] = await db
    .select({ value: max(tasks.position) })
    .from(tasks)
    .where(
      and(eq(tasks.organizationId, organizationId), eq(tasks.status, status)),
    );

  const now = new Date();
  const taskId = createId();

  const [task] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(tasks)
      .values({
        id: taskId,
        organizationId,
        title: parsed.data.title,
        description: parsed.data.description,
        status,
        priority: parsed.data.priority ?? "NONE",
        position: (maxPos?.value ?? -1) + 1,
        assigneeId,
        projectId,
        dueDate: parsed.data.dueDate ?? null,
        completedAt: status === "DONE" ? now : null,
        createdById: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await recordTaskCreated(tx, {
      taskId,
      userId: session.user.id,
      status,
    });

    if (created.assigneeId) {
      await createAssignmentNotification(tx, {
        recipientId: created.assigneeId,
        actorId: session.user.id,
        taskId,
      });
    }

    return [created];
  });

  const tags = await getTagsForTask(taskId);
  return NextResponse.json({ ...task, tags }, { status: 201 });
});
