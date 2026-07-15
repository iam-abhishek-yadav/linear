import { NextResponse } from "next/server";
import { z } from "zod";
import { TASK_STATUSES } from "@/lib/constants";
import { USER_ROLES } from "@/lib/roles";

export function zodErrorResponse(error: z.ZodError) {
  return NextResponse.json(
    { error: z.flattenError(error).fieldErrors },
    { status: 400 },
  );
}

const taskStatusSchema = z.enum(TASK_STATUSES);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  status: taskStatusSchema.optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().min(1).nullish(),
  projectId: z.string().min(1).nullish(),
  dueDate: z.coerce.date().nullish(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: taskStatusSchema.optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().min(1).nullish(),
  projectId: z.string().min(1).nullish(),
  dueDate: z.coerce.date().nullish(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(5000),
});

export const reorderTaskSchema = z.object({
  taskId: z.string(),
  status: taskStatusSchema,
  position: z.number().int().min(0),
});

const workspaceRegistrationFields = {
  orgName: z.string().min(1, "Organization name is required").max(100),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
};

export const registerSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
  ...workspaceRegistrationFields,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(USER_ROLES),
});
