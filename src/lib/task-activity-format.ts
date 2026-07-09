import { getPriorityMeta, getStatusMeta } from "@/lib/constants";
import type { TaskActivityType, TaskPriority, TaskStatus } from "@/lib/types";

type NamedUser = { name: string } | null;

function formatDueDate(date: Date | string | null) {
  if (!date) return "none";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function assigneeLabel(user: NamedUser) {
  return user?.name ?? "Unassigned";
}

export function formatActivityAction(activity: Parameters<typeof formatActivityMessage>[0]) {
  const full = formatActivityMessage(activity);
  const prefix = `${activity.user.name} `;
  return full.startsWith(prefix) ? full.slice(prefix.length) : full;
}

export function formatActivityMessage(activity: {
  type: TaskActivityType;
  user: { name: string };
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  fromPriority?: TaskPriority | null;
  toPriority?: TaskPriority | null;
  fromDueDate?: Date | string | null;
  toDueDate?: Date | string | null;
  fromAssignee?: NamedUser;
  toAssignee?: NamedUser;
}) {
  switch (activity.type) {
    case "CREATED":
      return `${activity.user.name} created this issue`;
    case "STATUS_CHANGED": {
      const from = activity.fromStatus
        ? getStatusMeta(activity.fromStatus).label
        : "Unknown";
      const to = activity.toStatus
        ? getStatusMeta(activity.toStatus).label
        : "Unknown";
      return `${activity.user.name} moved from ${from} to ${to}`;
    }
    case "ASSIGNEE_CHANGED":
      return `${activity.user.name} changed assignee from ${assigneeLabel(activity.fromAssignee ?? null)} to ${assigneeLabel(activity.toAssignee ?? null)}`;
    case "PRIORITY_CHANGED": {
      const from = activity.fromPriority
        ? getPriorityMeta(activity.fromPriority).label
        : "No priority";
      const to = activity.toPriority
        ? getPriorityMeta(activity.toPriority).label
        : "No priority";
      return `${activity.user.name} changed priority from ${from} to ${to}`;
    }
    case "DUE_DATE_CHANGED":
      return `${activity.user.name} changed due date from ${formatDueDate(activity.fromDueDate ?? null)} to ${formatDueDate(activity.toDueDate ?? null)}`;
    default:
      return `${activity.user.name} updated this issue`;
  }
}

export function formatActivityTime(date: Date | string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
