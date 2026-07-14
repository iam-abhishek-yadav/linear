import type { TaskPriority } from "@/db/schema";
import type { Task } from "@/lib/types";
import type { TaskTagSummary } from "@/lib/tags";

export const UNASSIGNED_ASSIGNEE_ID = "unassigned";

export type ViewFilters = {
  assigneeId: string | null;
  priorities: TaskPriority[];
  tagIds: string[];
};

export const EMPTY_VIEW_FILTERS: ViewFilters = {
  assigneeId: null,
  priorities: [],
  tagIds: [],
};

export function parseAssigneeFilter(value: string | null): string | null {
  if (!value) return null;
  const id = value.split(",")[0]?.trim();
  return id || null;
}

export function serializeAssigneeFilter(id: string | null): string | null {
  return id || null;
}

export function parsePriorityFilter(value: string | null): TaskPriority[] {
  if (!value) return [];
  const allowed = new Set<TaskPriority>([
    "NONE",
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
  ]);
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is TaskPriority => allowed.has(item as TaskPriority));
}

export function serializePriorityFilter(
  priorities: TaskPriority[],
): string | null {
  return priorities.length > 0 ? priorities.join(",") : null;
}

export function parseTagFilter(value: string | null): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function serializeTagFilter(tagIds: string[]): string | null {
  return tagIds.length > 0 ? tagIds.join(",") : null;
}

export function parseViewFilters(params: {
  assignee: string | null;
  priority: string | null;
  tag: string | null;
}): ViewFilters {
  return {
    assigneeId: parseAssigneeFilter(params.assignee),
    priorities: parsePriorityFilter(params.priority),
    tagIds: parseTagFilter(params.tag),
  };
}

export function hasActiveViewFilters(filters: ViewFilters): boolean {
  return (
    filters.assigneeId !== null ||
    filters.priorities.length > 0 ||
    filters.tagIds.length > 0
  );
}

export function filterByAssignee<T extends Pick<Task, "assigneeId">>(
  tasks: T[],
  selectedId: string | null,
): T[] {
  if (!selectedId) return tasks;

  if (selectedId === UNASSIGNED_ASSIGNEE_ID) {
    return tasks.filter((task) => task.assigneeId === null);
  }

  return tasks.filter((task) => task.assigneeId === selectedId);
}

export function filterByPriority<T extends Pick<Task, "priority">>(
  tasks: T[],
  priorities: TaskPriority[],
): T[] {
  if (priorities.length === 0) return tasks;
  const set = new Set(priorities);
  return tasks.filter((task) => set.has(task.priority));
}

export function filterByTags<
  T extends { tags?: Pick<TaskTagSummary, "id">[] | null },
>(tasks: T[], tagIds: string[]): T[] {
  if (tagIds.length === 0) return tasks;
  const set = new Set(tagIds);
  return tasks.filter((task) =>
    (task.tags ?? []).some((tag) => set.has(tag.id)),
  );
}

export function applyTaskFilters<
  T extends Pick<Task, "assigneeId" | "priority"> & {
    tags?: Pick<TaskTagSummary, "id">[] | null;
  },
>(tasks: T[], filters: ViewFilters): T[] {
  return filterByTags(
    filterByPriority(filterByAssignee(tasks, filters.assigneeId), filters.priorities),
    filters.tagIds,
  );
}
