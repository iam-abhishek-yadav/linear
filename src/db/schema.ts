import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const taskStatusEnum = pgEnum("TaskStatus", [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "CANCELED",
]);

export const taskPriorityEnum = pgEnum("TaskPriority", [
  "NONE",
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const tasks = pgTable(
  "Task",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("BACKLOG"),
    priority: taskPriorityEnum("priority").notNull().default("NONE"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("Task_status_position_idx").on(table.status, table.position)],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];
