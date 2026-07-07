import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { taskComments } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string; commentId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, commentId } = await context.params;

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
}
