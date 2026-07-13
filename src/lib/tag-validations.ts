import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().trim().min(1, "Label name is required").max(30),
  color: z.string().min(1).optional(),
});

export const setTaskTagsSchema = z.object({
  tagIds: z.array(z.string().min(1)).max(20),
});
