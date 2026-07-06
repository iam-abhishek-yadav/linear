CREATE TYPE "public"."TaskActivityType" AS ENUM('CREATED', 'STATUS_CHANGED');--> statement-breakpoint
CREATE TABLE "TaskActivity" (
	"id" text PRIMARY KEY NOT NULL,
	"taskId" text NOT NULL,
	"userId" text NOT NULL,
	"type" "TaskActivityType" NOT NULL,
	"fromStatus" "TaskStatus",
	"toStatus" "TaskStatus",
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Task" ADD COLUMN "createdById" text;--> statement-breakpoint
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_taskId_Task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "TaskActivity_taskId_createdAt_idx" ON "TaskActivity" USING btree ("taskId","createdAt");--> statement-breakpoint
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;