import type { Task } from "@/lib/types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type TaskWithCompletion = Pick<Task, "status"> & {
  completedAt?: Date | string | null;
  updatedAt?: Date | string;
};

export function getTaskCompletedAt(task: TaskWithCompletion): Date | null {
  if (task.status !== "DONE") return null;
  if (task.completedAt) return new Date(task.completedAt);
  if (task.updatedAt) return new Date(task.updatedAt);
  return null;
}

export function isStaleCompletedTask(task: TaskWithCompletion): boolean {
  const completedAt = getTaskCompletedAt(task);
  if (!completedAt) return false;
  return Date.now() - completedAt.getTime() > ONE_DAY_MS;
}

export function filterMainViewTasks<T extends TaskWithCompletion>(tasks: T[]): T[] {
  return tasks.filter((task) => !isStaleCompletedTask(task));
}

export function countStaleCompletedTasks<T extends TaskWithCompletion>(
  tasks: T[],
): number {
  return tasks.filter(isStaleCompletedTask).length;
}

export function resolveCompletedAtUpdate(
  existingStatus: Task["status"],
  nextStatus: Task["status"],
): Date | null | undefined {
  if (nextStatus === "DONE" && existingStatus !== "DONE") {
    return new Date();
  }
  if (nextStatus !== "DONE" && existingStatus === "DONE") {
    return null;
  }
  return undefined;
}
