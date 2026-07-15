import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/auth";
import { mentionedIdsStillInBody } from "@/lib/comment-mentions";
import { db } from "@/lib/db";
import { filterOrgMemberIds } from "@/lib/org-members";
import {
  createCommentNotification,
  createMentionNotifications,
} from "@/lib/notifications";
import { createTaskComment, getTaskComments } from "@/lib/task-comments";
import { getOrganizationTask } from "@/lib/task-access";
import { createCommentSchema, zodErrorResponse } from "@/lib/validations";
import { withApiRoute } from "@/lib/logger";
import { users } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withApiRoute(
  "tasks.comments.list",
  async (_request: Request, context: RouteContext) => {
    const guard = await requireUserOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;

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
    const guard = await requireUserOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;

    const { id } = await context.params;
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const task = await getOrganizationTask(session.organization.id, id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const orgMemberIds = await filterOrgMemberIds(
      session.organization.id,
      parsed.data.mentionedUserIds,
    );

    const mentionRows =
      orgMemberIds.length === 0
        ? []
        : await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(
              and(
                eq(users.organizationId, session.organization.id),
                inArray(users.id, orgMemberIds),
              ),
            );

    const mentionedUserIds = mentionedIdsStillInBody(
      parsed.data.body,
      mentionRows,
    );

    const commentId = await db.transaction(async (tx) => {
      const idCreated = await createTaskComment(tx, {
        taskId: id,
        userId: session.user.id,
        body: parsed.data.body,
      });

      const mentionedSet = new Set(mentionedUserIds);

      // Prefer MENTIONED over COMMENT when the assignee was @mentioned.
      if (!task.assigneeId || !mentionedSet.has(task.assigneeId)) {
        await createCommentNotification(tx, {
          assigneeId: task.assigneeId,
          actorId: session.user.id,
          taskId: id,
        });
      }

      await createMentionNotifications(tx, {
        mentionedUserIds,
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
