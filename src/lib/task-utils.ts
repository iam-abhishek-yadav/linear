import type { Task } from "@/lib/types";

const FALLBACK_PROJECT_KEY = "ML";

/** Derive a short uppercase ticket prefix (e.g. "Acme Corp" -> "AC") from the org name. */
export function getProjectKey(orgName: string): string {
  const words = orgName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return FALLBACK_PROJECT_KEY;
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((word) => word[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

export function formatTaskIdentifier(
  task: Task,
  allTasks: Task[],
  projectKey: string,
): string {
  const sorted = [...allTasks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const index = sorted.findIndex((t) => t.id === task.id) + 1;
  return `${projectKey}-${index}`;
}

export function formatTaskDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
