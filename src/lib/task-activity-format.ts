import { getStatusMeta } from "@/lib/constants";
import type { TaskActivityType, TaskStatus } from "@/lib/types";

export function formatActivityMessage(activity: {
  type: TaskActivityType;
  user: { name: string };
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
}) {
  if (activity.type === "CREATED") {
    return `${activity.user.name} created this issue`;
  }

  const from = activity.fromStatus
    ? getStatusMeta(activity.fromStatus).label
    : "Unknown";
  const to = activity.toStatus
    ? getStatusMeta(activity.toStatus).label
    : "Unknown";

  return `${activity.user.name} moved from ${from} to ${to}`;
}

export function formatActivityTime(date: Date | string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
