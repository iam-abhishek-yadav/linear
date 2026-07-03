import { z } from "zod";

export const createMemberInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const acceptMemberInviteSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
