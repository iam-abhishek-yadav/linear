import { z } from "zod";

export const CODE_SNIPPET_LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "html",
  "css",
] as const;

export const CODE_SNIPPET_LANGUAGE_LABELS: Record<
  (typeof CODE_SNIPPET_LANGUAGES)[number],
  string
> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  html: "HTML",
  css: "CSS",
};

export const CODE_SNIPPET_LANGUAGE_EXTENSIONS: Record<
  (typeof CODE_SNIPPET_LANGUAGES)[number],
  string
> = {
  typescript: ".ts",
  javascript: ".js",
  python: ".py",
  html: ".html",
  css: ".css",
};

/** Max body size ~100KB of UTF-16 code units — keeps payloads reasonable. */
export const CODE_SNIPPET_MAX_BODY_LENGTH = 100_000;

const filenameSchema = z
  .string()
  .trim()
  .min(1, "Filename is required")
  .max(120, "Filename must be 120 characters or less")
  .regex(
    /^[\w.-]+$/,
    "Use letters, numbers, dots, dashes, or underscores only",
  );

export const createCodeSnippetSchema = z.object({
  title: filenameSchema,
  language: z.enum(CODE_SNIPPET_LANGUAGES),
  body: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(
      CODE_SNIPPET_MAX_BODY_LENGTH,
      "Code is too long (max 100,000 characters)",
    ),
  recipientId: z.string().min(1, "Recipient is required"),
});
