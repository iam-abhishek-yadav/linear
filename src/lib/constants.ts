import type { TaskPriority, TaskStatus } from "@/lib/types";

export const TASK_STATUSES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "CANCELED",
] as const satisfies readonly TaskStatus[];

export const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "BACKLOG", label: "Backlog" },
  { id: "TODO", label: "Todo" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "DONE", label: "Done" },
  { id: "CANCELED", label: "Canceled" },
];

/** Display order for list view — matches Linear */
export const LIST_STATUS_ORDER: TaskStatus[] = [
  "IN_PROGRESS",
  "TODO",
  "BACKLOG",
  "DONE",
  "CANCELED",
];

export const PRIORITIES: { id: TaskPriority; label: string; color: string }[] = [
  { id: "NONE", label: "No priority", color: "text-muted-foreground" },
  { id: "LOW", label: "Low", color: "text-blue-400" },
  { id: "MEDIUM", label: "Medium", color: "text-yellow-400" },
  { id: "HIGH", label: "High", color: "text-orange-400" },
  { id: "URGENT", label: "Urgent", color: "text-red-400" },
];

export function getPriorityMeta(priority: TaskPriority) {
  return PRIORITIES.find((p) => p.id === priority) ?? PRIORITIES[0];
}

export function getStatusMeta(status: TaskStatus) {
  return COLUMNS.find((c) => c.id === status) ?? COLUMNS[0];
}
