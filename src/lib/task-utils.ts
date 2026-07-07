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

/** Normalize a task's due date into a `yyyy-mm-dd` value for a native date input. */
export function toDateInputValue(
  date: Date | string | null | undefined,
): string | null {
  if (!date) return null;
  if (typeof date === "string") {
    // Stored as an ISO string at UTC midnight; keep the calendar day intact.
    return date.slice(0, 10);
  }
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Human-friendly ETA label (e.g. "Jul 10") from a due date, timezone-safe. */
export function formatDueDate(
  date: Date | string | null | undefined,
): string | null {
  const input = toDateInputValue(date);
  if (!input) return null;
  const [y, m, d] = input.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Whether a due date is in the past (before today). */
export function isOverdue(date: Date | string | null | undefined): boolean {
  const input = toDateInputValue(date);
  if (!input) return false;
  const [y, m, d] = input.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}
