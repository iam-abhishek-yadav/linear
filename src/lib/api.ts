import type { IssueDetailData } from "@/lib/issue-detail-data";
import type { IssueTimelineData } from "@/lib/issue-timeline-data";
import type { MembersPageData } from "@/lib/members";
import type { NotificationItem } from "@/lib/notification-types";
import type { ProjectSummary } from "@/lib/projects";
import type { TaskTagSummary } from "@/lib/tags";
import type { Task, TaskWithTags } from "@/lib/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${url}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchTasks(): Promise<TaskWithTags[]> {
  return fetchJson<TaskWithTags[]>("/api/tasks");
}

export async function fetchMembersPage(): Promise<MembersPageData> {
  return fetchJson<MembersPageData>("/api/members");
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  return fetchJson<NotificationItem[]>("/api/notifications");
}

export async function fetchTags(): Promise<TaskTagSummary[]> {
  const { tags } = await fetchJson<{ tags: TaskTagSummary[] }>("/api/tags");
  return tags;
}

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const { projects } = await fetchJson<{ projects: ProjectSummary[] }>(
    "/api/projects",
  );
  return projects;
}

export async function fetchProjectAccessRequests() {
  const { requests } = await fetchJson<{
    requests: import("@/lib/project-access-requests").ProjectAccessRequestItem[];
  }>("/api/projects/access-requests");
  return requests;
}

export async function requestProjectAccess(projectId: string) {
  return fetchJson<{ request: { id: string; status: string } }>(
    `/api/projects/${projectId}/access-requests`,
    { method: "POST" },
  );
}

export async function reviewProjectAccessRequest(
  requestId: string,
  action: "approve" | "deny",
) {
  return fetchJson<{ ok: true; status: string }>(
    `/api/projects/access-requests/${requestId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    },
  );
}

export type ProjectAccessDenied = {
  error: "PROJECT_ACCESS_REQUIRED";
  project: { id: string; name: string };
  accessRequestStatus: "PENDING" | "APPROVED" | "DENIED" | null;
};

export type FetchTaskResult =
  | { status: "ok"; task: TaskWithTags }
  | { status: "not_found" }
  | { status: "project_access"; access: ProjectAccessDenied }
  | { status: "error" };

export async function fetchTask(taskId: string): Promise<FetchTaskResult> {
  const response = await fetch(`/api/tasks/${taskId}`);
  if (response.status === 404) return { status: "not_found" };
  if (response.status === 403) {
    const body = (await response.json()) as ProjectAccessDenied;
    if (body.error === "PROJECT_ACCESS_REQUIRED") {
      return { status: "project_access", access: body };
    }
    return { status: "error" };
  }
  if (!response.ok) return { status: "error" };
  const task = (await response.json()) as TaskWithTags;
  return { status: "ok", task };
}

export async function fetchIssueTimeline(
  taskId: string,
): Promise<IssueTimelineData> {
  const response = await fetch(`/api/tasks/${taskId}/timeline`);
  if (!response.ok) throw new Error("Failed to load issue timeline");
  return response.json() as Promise<IssueTimelineData>;
}

export async function fetchIssueDetail(
  taskId: string,
): Promise<
  | { status: "ok"; data: IssueDetailData }
  | { status: "not_found" }
  | { status: "project_access"; access: ProjectAccessDenied }
  | { status: "error" }
> {
  const response = await fetch(`/api/tasks/${taskId}/detail`);
  if (response.status === 404) return { status: "not_found" };
  if (response.status === 403) {
    const body = (await response.json()) as ProjectAccessDenied;
    if (body.error === "PROJECT_ACCESS_REQUIRED") {
      return { status: "project_access", access: body };
    }
    return { status: "error" };
  }
  if (!response.ok) return { status: "error" };
  const data = (await response.json()) as IssueDetailData;
  return { status: "ok", data };
}

export type TaskInput = {
  title: string;
  description?: string;
  status: Task["status"];
  priority: Task["priority"];
  assigneeId?: string | null;
  projectId?: string | null;
  dueDate?: string | null;
};

export async function createTask(data: TaskInput): Promise<TaskWithTags> {
  return fetchJson<TaskWithTags>("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateTask(
  id: string,
  data: TaskInput,
): Promise<TaskWithTags> {
  return fetchJson<TaskWithTags>(`/api/tasks/${id}`, {
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
}): Promise<TaskWithTags> {
  return fetchJson<TaskWithTags>("/api/tasks/reorder", {
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
