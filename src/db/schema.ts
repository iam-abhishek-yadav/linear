import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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
    assigneeId: text("assigneeId").references(() => users.id, {
      onDelete: "set null",
    }),
    dueDate: timestamp("dueDate", { precision: 3, mode: "date" }),
    createdById: text("createdById").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("Task_status_position_idx").on(table.status, table.position),
    index("Task_assigneeId_idx").on(table.assigneeId),
  ],
);

export const taskActivityTypeEnum = pgEnum("TaskActivityType", [
  "CREATED",
  "STATUS_CHANGED",
]);

export const taskActivities = pgTable(
  "TaskActivity",
  {
    id: text("id").primaryKey(),
    taskId: text("taskId")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: taskActivityTypeEnum("type").notNull(),
    fromStatus: taskStatusEnum("fromStatus"),
    toStatus: taskStatusEnum("toStatus"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("TaskActivity_taskId_createdAt_idx").on(table.taskId, table.createdAt),
  ],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];

export const userRoleEnum = pgEnum("UserRole", ["ADMIN", "MEMBER"]);

export const organizations = pgTable(
  "Organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("Organization_slug_key").on(table.slug)],
);

export const users = pgTable(
  "User",
  {
    id: text("id").primaryKey(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("passwordHash").notNull(),
    role: userRoleEnum("role").notNull().default("ADMIN"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("User_email_key").on(table.email),
    index("User_organizationId_idx").on(table.organizationId),
  ],
);

export const sessions = pgTable(
  "Session",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("Session_userId_idx").on(table.userId)],
);

export const orgInvites = pgTable(
  "OrgInvite",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    email: text("email"),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    acceptedAt: timestamp("acceptedAt", { precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("OrgInvite_token_key").on(table.token),
    index("OrgInvite_email_idx").on(table.email),
  ],
);

export const memberInvites = pgTable(
  "MemberInvite",
  {
    id: text("id").primaryKey(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    email: text("email").notNull(),
    invitedByUserId: text("invitedByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    acceptedAt: timestamp("acceptedAt", { precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("MemberInvite_token_key").on(table.token),
    index("MemberInvite_organizationId_idx").on(table.organizationId),
    index("MemberInvite_email_idx").on(table.email),
  ],
);

export type TaskActivity = typeof taskActivities.$inferSelect;
export type TaskActivityType = (typeof taskActivityTypeEnum.enumValues)[number];
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type OrgInvite = typeof orgInvites.$inferSelect;
export type MemberInvite = typeof memberInvites.$inferSelect;
