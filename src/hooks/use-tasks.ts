"use client";

import { useTasksContext } from "@/components/tasks-provider";

export type TaskInput = {
  title: string;
  description?: string;
  status: import("@/lib/types").Task["status"];
  priority: import("@/lib/types").Task["priority"];
  assigneeId?: string | null;
  dueDate?: string | null;
};

export function useTasks() {
  return useTasksContext();
}
