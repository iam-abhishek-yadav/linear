import { z } from "zod";
import { TASK_STATUSES } from "@/lib/constants";

const taskStatusSchema = z.enum(TASK_STATUSES);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  status: taskStatusSchema.optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: taskStatusSchema.optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  position: z.number().int().min(0).optional(),
});

export const reorderTaskSchema = z.object({
  taskId: z.string(),
  status: taskStatusSchema,
  position: z.number().int().min(0),
});
