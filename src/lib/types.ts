export type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskActivityType,
  NotificationType,
  Tag,
  CodeSnippetLanguage,
} from "@/db/schema";

export type { TaskTagSummary } from "@/lib/tags";

export type TaskWithTags = import("@/db/schema").Task & {
  tags?: import("@/lib/tags").TaskTagSummary[];
};
