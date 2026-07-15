ALTER TABLE "Task" ADD COLUMN "projectId" text;--> statement-breakpoint
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Task_projectId_idx" ON "Task" USING btree ("projectId");