import type { Task } from "@/lib/types";

export const PROJECT_KEY = "ML";

export function formatTaskIdentifier(task: Task, allTasks: Task[]): string {
  const sorted = [...allTasks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const index = sorted.findIndex((t) => t.id === task.id) + 1;
  return `${PROJECT_KEY}-${index}`;
}

export function formatTaskDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
