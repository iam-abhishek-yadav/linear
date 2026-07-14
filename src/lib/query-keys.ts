export const STALE_TIME_MS = 30_000;
export const GC_TIME_MS = 5 * 60_000;
export const NOTIFICATIONS_POLL_MS = 30_000;

export const queryKeys = {
  tasks: ["tasks"] as const,
  tags: ["tags"] as const,
  orgMembers: ["org-members"] as const,
  notifications: ["notifications"] as const,
  issueDetail: (taskId: string) => ["issues", taskId, "detail"] as const,
};
