import type { Task } from "@/lib/types";

export const UNASSIGNED_ASSIGNEE_ID = "unassigned";

export function parseAssigneeFilter(value: string | null): string | null {
  if (!value) return null;
  const id = value.split(",")[0]?.trim();
  return id || null;
}

export function serializeAssigneeFilter(id: string | null): string | null {
  return id || null;
}

export function filterByAssignee(
  tasks: Task[],
  selectedId: string | null,
): Task[] {
  if (!selectedId) return tasks;

  if (selectedId === UNASSIGNED_ASSIGNEE_ID) {
    return tasks.filter((task) => task.assigneeId === null);
  }

  return tasks.filter((task) => task.assigneeId === selectedId);
}
