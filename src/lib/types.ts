import type { Task } from "@/db/schema";

export type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskActivity,
  TaskActivityType,
  TaskComment,
  Notification,
  NotificationType,
  NewTask,
} from "@/db/schema";

export type TasksByStatus = Record<Task["status"], Task[]>;

export type {
  NotificationActor,
  NotificationItem,
} from "@/lib/notification-types";
