ALTER TYPE "public"."NotificationType" ADD VALUE 'COMMENT';--> statement-breakpoint
ALTER TYPE "public"."NotificationType" ADD VALUE 'STATUS_CHANGED';--> statement-breakpoint
ALTER TYPE "public"."TaskActivityType" ADD VALUE 'ASSIGNEE_CHANGED';--> statement-breakpoint
ALTER TYPE "public"."TaskActivityType" ADD VALUE 'PRIORITY_CHANGED';--> statement-breakpoint
ALTER TYPE "public"."TaskActivityType" ADD VALUE 'DUE_DATE_CHANGED';--> statement-breakpoint
ALTER TABLE "TaskActivity" ADD COLUMN "fromPriority" "TaskPriority";--> statement-breakpoint
ALTER TABLE "TaskActivity" ADD COLUMN "toPriority" "TaskPriority";--> statement-breakpoint
ALTER TABLE "TaskActivity" ADD COLUMN "fromAssigneeId" text;--> statement-breakpoint
ALTER TABLE "TaskActivity" ADD COLUMN "toAssigneeId" text;--> statement-breakpoint
ALTER TABLE "TaskActivity" ADD COLUMN "fromDueDate" timestamp (3);--> statement-breakpoint
ALTER TABLE "TaskActivity" ADD COLUMN "toDueDate" timestamp (3);--> statement-breakpoint
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_fromAssigneeId_User_id_fk" FOREIGN KEY ("fromAssigneeId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_toAssigneeId_User_id_fk" FOREIGN KEY ("toAssigneeId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;