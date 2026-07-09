import { createId } from "@paralleldrive/cuid2";
import type { Member } from "@/hooks/use-members";
import type { TaskActivityItem } from "@/components/issues/task-activity-feed";
import type { Task } from "@/lib/types";

type TimelineUser = { id: string; name: string };

function memberById(members: Member[], id: string | null) {
  if (!id) return null;
  const member = members.find((m) => m.id === id);
  return member ? { id: member.id, name: member.name } : null;
}

export function buildPropertyChangeActivity(
  field: "status" | "priority" | "assigneeId" | "dueDate",
  previous: {
    status: Task["status"];
    priority: Task["priority"];
    assigneeId: string | null;
    dueDate: string | null;
  },
  next: {
    status: Task["status"];
    priority: Task["priority"];
    assigneeId: string | null;
    dueDate: string | null;
  },
  user: TimelineUser,
  members: Member[],
): TaskActivityItem | null {
  const base = {
    id: createId(),
    createdAt: new Date().toISOString(),
    user,
    fromStatus: null,
    toStatus: null,
    fromPriority: null,
    toPriority: null,
    fromDueDate: null,
    toDueDate: null,
    fromAssignee: null,
    toAssignee: null,
  };

  switch (field) {
    case "status": {
      if (previous.status === next.status) return null;
      return {
        ...base,
        type: "STATUS_CHANGED",
        fromStatus: previous.status,
        toStatus: next.status,
      };
    }
    case "priority": {
      if (previous.priority === next.priority) return null;
      return {
        ...base,
        type: "PRIORITY_CHANGED",
        fromPriority: previous.priority,
        toPriority: next.priority,
      };
    }
    case "assigneeId": {
      if (previous.assigneeId === next.assigneeId) return null;
      return {
        ...base,
        type: "ASSIGNEE_CHANGED",
        fromAssignee: memberById(members, previous.assigneeId),
        toAssignee: memberById(members, next.assigneeId),
      };
    }
    case "dueDate": {
      if (previous.dueDate === next.dueDate) return null;
      return {
        ...base,
        type: "DUE_DATE_CHANGED",
        fromDueDate: previous.dueDate,
        toDueDate: next.dueDate,
      };
    }
    default:
      return null;
  }
}
