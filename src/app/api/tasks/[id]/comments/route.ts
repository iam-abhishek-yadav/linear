import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCommentNotification } from "@/lib/notifications";
import { createTaskComment, getTaskComments } from "@/lib/task-comments";
import { getOrganizationTask } from "@/lib/task-access";
import { createCommentSchema } from "@/lib/validations";
import { withApiRoute } from "@/lib/logger";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withApiRoute(
  "tasks.comments.list",
  async (_request: Request, context: RouteContext) => {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const task = await getOrganizationTask(session.organization.id, id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const comments = await getTaskComments(id);

  return NextResponse.json(
    comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      user: comment.user,
    })),
  );
  },
);

export const POST = withApiRoute(
  "tasks.comments.create",
  async (request: Request, context: RouteContext) => {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = createCommentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const task = await getOrganizationTask(session.organization.id, id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const commentId = await db.transaction(async (tx) => {
    const idCreated = await createTaskComment(tx, {
      taskId: id,
      userId: session.user.id,
      body: parsed.data.body,
    });

    await createCommentNotification(tx, {
      assigneeId: task.assigneeId,
      actorId: session.user.id,
      taskId: id,
    });

    return idCreated;
  });

  return NextResponse.json(
    {
      id: commentId,
      body: parsed.data.body,
      createdAt: new Date().toISOString(),
      user: { id: session.user.id, name: session.user.name },
    },
    { status: 201 },
  );
  },
);
