CREATE TABLE "TaskComment" (
	"id" text PRIMARY KEY NOT NULL,
	"taskId" text NOT NULL,
	"userId" text NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_Task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "TaskComment_taskId_createdAt_idx" ON "TaskComment" USING btree ("taskId","createdAt");