import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { taskComments } from "@/db/schema";
import { requireUserOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrganizationTask } from "@/lib/task-access";
import { withApiRoute } from "@/lib/logger";

type RouteContext = {
  params: Promise<{ id: string; commentId: string }>;
};

export const DELETE = withApiRoute(
  "tasks.comments.delete",
  async (_request: Request, context: RouteContext) => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const { id, commentId } = await context.params;

  const task = await getOrganizationTask(session.organization.id, id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const [comment] = await db
    .select({ id: taskComments.id, userId: taskComments.userId })
    .from(taskComments)
    .where(and(eq(taskComments.id, commentId), eq(taskComments.taskId, id)));

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const isAuthor = comment.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isAuthor && !isAdmin) {
    return NextResponse.json(
      { error: "You can only delete your own comments" },
      { status: 403 },
    );
  }

  await db.delete(taskComments).where(eq(taskComments.id, commentId));

  return NextResponse.json({ success: true });
  },
);
