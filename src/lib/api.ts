import type { IssueDetailData } from "@/lib/issue-detail-data";
import type { MembersPageData } from "@/lib/members";
import type { NotificationItem } from "@/lib/notification-types";
import type { Task } from "@/lib/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${url}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchTasks(): Promise<Task[]> {
  return fetchJson<Task[]>("/api/tasks");
}

export async function fetchMembersPage(): Promise<MembersPageData> {
  return fetchJson<MembersPageData>("/api/members");
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  return fetchJson<NotificationItem[]>("/api/notifications");
}

export async function fetchIssueDetail(
  taskId: string,
): Promise<IssueDetailData | null> {
  const response = await fetch(`/api/tasks/${taskId}/detail`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to load issue");
  return response.json() as Promise<IssueDetailData>;
}

export type TaskInput = {
  title: string;
  description?: string;
  status: Task["status"];
  priority: Task["priority"];
  assigneeId?: string | null;
  dueDate?: string | null;
};

export async function createTask(data: TaskInput): Promise<Task> {
  return fetchJson<Task>("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateTask(
  id: string,
  data: TaskInput,
): Promise<Task> {
  return fetchJson<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await fetchJson(`/api/tasks/${id}`, { method: "DELETE" });
}

export async function reorderTask(input: {
  taskId: string;
  status: Task["status"];
  position: number;
}): Promise<Task> {
  return fetchJson<Task>("/api/tasks/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetchJson(`/api/notifications/${id}`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetchJson("/api/notifications/read-all", { method: "POST" });
}
