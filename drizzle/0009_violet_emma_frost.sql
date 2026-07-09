ALTER TABLE "Task" ADD COLUMN "completedAt" timestamp (3);--> statement-breakpoint
UPDATE "Task" SET "completedAt" = "updatedAt" WHERE status = 'DONE' AND "completedAt" IS NULL;