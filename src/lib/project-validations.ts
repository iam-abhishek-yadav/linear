import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(100),
  description: z.string().trim().max(2000).optional(),
  memberIds: z.array(z.string().min(1)).max(100).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(100).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

export const setProjectMembersSchema = z.object({
  memberIds: z.array(z.string().min(1)).max(100),
});
