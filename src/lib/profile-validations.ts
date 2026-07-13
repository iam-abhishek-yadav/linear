import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  newPassword: passwordSchema,
});
