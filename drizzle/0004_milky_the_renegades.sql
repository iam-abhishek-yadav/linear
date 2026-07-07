ALTER TABLE "Task" ADD COLUMN "assigneeId" text;--> statement-breakpoint
ALTER TABLE "Task" ADD COLUMN "dueDate" timestamp (3);--> statement-breakpoint
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_User_id_fk" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Task_assigneeId_idx" ON "Task" USING btree ("assigneeId");