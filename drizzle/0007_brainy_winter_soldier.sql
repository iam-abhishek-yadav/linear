DROP INDEX IF EXISTS "Task_status_position_idx";--> statement-breakpoint
ALTER TABLE "Task" ADD COLUMN "organizationId" text;--> statement-breakpoint
UPDATE "Task" AS t
SET "organizationId" = u."organizationId"
FROM "User" AS u
WHERE t."createdById" = u.id
  AND t."organizationId" IS NULL;--> statement-breakpoint
UPDATE "Task" AS t
SET "organizationId" = u."organizationId"
FROM "User" AS u
WHERE t."assigneeId" = u.id
  AND t."organizationId" IS NULL;--> statement-breakpoint
DELETE FROM "Task" WHERE "organizationId" IS NULL;--> statement-breakpoint
ALTER TABLE "Task" ALTER COLUMN "organizationId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Task_organizationId_status_position_idx" ON "Task" USING btree ("organizationId","status","position");--> statement-breakpoint
CREATE INDEX "Task_organizationId_idx" ON "Task" USING btree ("organizationId");
