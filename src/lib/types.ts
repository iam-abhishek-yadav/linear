import type { Task } from "@/db/schema";

export type { Task, TaskStatus, TaskPriority, NewTask } from "@/db/schema";

export type TasksByStatus = Record<Task["status"], Task[]>;
