ALTER TABLE "CodeSnippet" ALTER COLUMN "language" SET DATA TYPE text;--> statement-breakpoint
UPDATE "CodeSnippet" SET "language" = 'typescript' WHERE "language" IN ('react', 'next');--> statement-breakpoint
UPDATE "CodeSnippet" SET "language" = 'python' WHERE "language" = 'fastapi';--> statement-breakpoint
DROP TYPE "public"."CodeSnippetLanguage";--> statement-breakpoint
CREATE TYPE "public"."CodeSnippetLanguage" AS ENUM('typescript', 'javascript', 'python', 'html', 'css');--> statement-breakpoint
ALTER TABLE "CodeSnippet" ALTER COLUMN "language" SET DATA TYPE "public"."CodeSnippetLanguage" USING "language"::"public"."CodeSnippetLanguage";
