export const STALE_TIME_MS = 30_000;
export const GC_TIME_MS = 5 * 60_000;
export const NOTIFICATIONS_POLL_MS = 30_000;
export const ISSUE_TIMELINE_STALE_MS = 60_000;
export const TAGS_STALE_MS = 5 * 60_000;
export const PROJECTS_STALE_MS = 5 * 60_000;

export const queryKeys = {
  tasks: ["tasks"] as const,
  tags: ["tags"] as const,
  projects: ["projects"] as const,
  orgMembers: ["org-members"] as const,
  notifications: ["notifications"] as const,
  task: (taskId: string) => ["tasks", taskId] as const,
  issueDetail: (taskId: string) => ["issues", taskId, "detail"] as const,
  issueTimeline: (taskId: string) => ["issues", taskId, "timeline"] as const,
};
