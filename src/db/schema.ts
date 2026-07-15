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
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("BACKLOG"),
    priority: taskPriorityEnum("priority").notNull().default("NONE"),
    position: integer("position").notNull().default(0),
    assigneeId: text("assigneeId").references(() => users.id, {
      onDelete: "set null",
    }),
    projectId: text("projectId").references(() => projects.id, {
      onDelete: "set null",
    }),
    dueDate: timestamp("dueDate", { precision: 3, mode: "date" }),
    completedAt: timestamp("completedAt", { precision: 3, mode: "date" }),
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
    index("Task_organizationId_status_position_idx").on(
      table.organizationId,
      table.status,
      table.position,
    ),
    index("Task_organizationId_idx").on(table.organizationId),
    index("Task_assigneeId_idx").on(table.assigneeId),
    index("Task_projectId_idx").on(table.projectId),
  ],
);

export const taskActivityTypeEnum = pgEnum("TaskActivityType", [
  "CREATED",
  "STATUS_CHANGED",
  "ASSIGNEE_CHANGED",
  "PRIORITY_CHANGED",
  "DUE_DATE_CHANGED",
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
    fromPriority: taskPriorityEnum("fromPriority"),
    toPriority: taskPriorityEnum("toPriority"),
    fromAssigneeId: text("fromAssigneeId").references(() => users.id, {
      onDelete: "set null",
    }),
    toAssigneeId: text("toAssigneeId").references(() => users.id, {
      onDelete: "set null",
    }),
    fromDueDate: timestamp("fromDueDate", { precision: 3, mode: "date" }),
    toDueDate: timestamp("toDueDate", { precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("TaskActivity_taskId_createdAt_idx").on(table.taskId, table.createdAt),
  ],
);

export const taskComments = pgTable(
  "TaskComment",
  {
    id: text("id").primaryKey(),
    taskId: text("taskId")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("TaskComment_taskId_createdAt_idx").on(table.taskId, table.createdAt),
  ],
);

export const notificationTypeEnum = pgEnum("NotificationType", [
  "ASSIGNED",
  "COMMENT",
  "STATUS_CHANGED",
  "MENTIONED",
]);

export const notifications = pgTable(
  "Notification",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: text("actorId").references(() => users.id, {
      onDelete: "set null",
    }),
    taskId: text("taskId")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    readAt: timestamp("readAt", { precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("Notification_userId_createdAt_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskComment = typeof taskComments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];

export const userRoleEnum = pgEnum("UserRole", [
  "ADMIN",
  "MANAGER",
  "MEMBER",
]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];

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
    passwordChangedAt: timestamp("passwordChangedAt", {
      precision: 3,
      mode: "date",
    }),
    role: userRoleEnum("role").notNull().default("MEMBER"),
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

export const passwordResetOtps = pgTable(
  "PasswordResetOtp",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    otpHash: text("otpHash").notNull(),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    usedAt: timestamp("usedAt", { precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("PasswordResetOtp_userId_createdAt_idx").on(
      table.userId,
      table.createdAt,
    ),
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

export const tags = pgTable(
  "Tag",
  {
    id: text("id").primaryKey(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("Tag_organizationId_name_key").on(
      table.organizationId,
      table.name,
    ),
    index("Tag_organizationId_idx").on(table.organizationId),
  ],
);

export const taskTags = pgTable(
  "TaskTag",
  {
    taskId: text("taskId")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: text("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("TaskTag_taskId_tagId_key").on(table.taskId, table.tagId),
    index("TaskTag_taskId_idx").on(table.taskId),
    index("TaskTag_tagId_idx").on(table.tagId),
  ],
);

export type TaskActivity = typeof taskActivities.$inferSelect;
export type TaskActivityType = (typeof taskActivityTypeEnum.enumValues)[number];
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type OrgInvite = typeof orgInvites.$inferSelect;
export type MemberInvite = typeof memberInvites.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type TaskTag = typeof taskTags.$inferSelect;
export type PasswordResetOtp = typeof passwordResetOtps.$inferSelect;

export const projects = pgTable(
  "Project",
  {
    id: text("id").primaryKey(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("Project_organizationId_name_key").on(
      table.organizationId,
      table.name,
    ),
    index("Project_organizationId_idx").on(table.organizationId),
  ],
);

export const projectMembers = pgTable(
  "ProjectMember",
  {
    projectId: text("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("ProjectMember_projectId_userId_key").on(
      table.projectId,
      table.userId,
    ),
    index("ProjectMember_projectId_idx").on(table.projectId),
    index("ProjectMember_userId_idx").on(table.userId),
  ],
);

export const projectAccessRequestStatusEnum = pgEnum(
  "ProjectAccessRequestStatus",
  ["PENDING", "APPROVED", "DENIED"],
);

export const projectAccessRequests = pgTable(
  "ProjectAccessRequest",
  {
    id: text("id").primaryKey(),
    projectId: text("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: projectAccessRequestStatusEnum("status").notNull().default("PENDING"),
    reviewedById: text("reviewedById").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewedAt", { precision: 3, mode: "date" }),
  },
  (table) => [
    uniqueIndex("ProjectAccessRequest_projectId_userId_key").on(
      table.projectId,
      table.userId,
    ),
    index("ProjectAccessRequest_projectId_status_idx").on(
      table.projectId,
      table.status,
    ),
    index("ProjectAccessRequest_userId_idx").on(table.userId),
  ],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type ProjectAccessRequest = typeof projectAccessRequests.$inferSelect;
export type ProjectAccessRequestStatus =
  (typeof projectAccessRequestStatusEnum.enumValues)[number];
