import { cache } from "react";
import type { TaskActivityItem } from "@/components/issues/task-activity-feed";
import type { TaskCommentItem } from "@/lib/task-comments";
import { logServerCall } from "@/lib/logger";
import { getOrgMembers } from "@/lib/members";
import { buildUserMapFromMembers, getTaskActivities } from "@/lib/task-activity";
import { getTaskComments } from "@/lib/task-comments";

export type IssueTimelineData = {
  activities: TaskActivityItem[];
  comments: TaskCommentItem[];
};

export const getIssueTimelineData = cache(
  (taskId: string) =>
    logServerCall("getIssueTimelineData", async () => {
      const members = await getOrgMembers();
      const userMap = buildUserMapFromMembers(members);

      const [activities, comments] = await Promise.all([
        getTaskActivities(taskId, userMap),
        getTaskComments(taskId),
      ]);

      return {
        activities: activities.map((activity) => ({
          id: activity.id,
          type: activity.type,
          fromStatus: activity.fromStatus,
          toStatus: activity.toStatus,
          fromPriority: activity.fromPriority,
          toPriority: activity.toPriority,
          fromDueDate: activity.fromDueDate?.toISOString() ?? null,
          toDueDate: activity.toDueDate?.toISOString() ?? null,
          fromAssignee: activity.fromAssignee,
          toAssignee: activity.toAssignee,
          createdAt: activity.createdAt.toISOString(),
          user: activity.user,
        })),
        comments: comments.map((comment) => ({
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt.toISOString(),
          user: comment.user,
        })),
      } satisfies IssueTimelineData;
    }),
);
