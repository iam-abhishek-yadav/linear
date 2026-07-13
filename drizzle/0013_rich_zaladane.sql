CREATE TABLE "Tag" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TaskTag" (
	"taskId" text NOT NULL,
	"tagId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_taskId_Task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_tagId_Tag_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "Tag_organizationId_name_key" ON "Tag" USING btree ("organizationId","name");--> statement-breakpoint
CREATE INDEX "Tag_organizationId_idx" ON "Tag" USING btree ("organizationId");--> statement-breakpoint
CREATE UNIQUE INDEX "TaskTag_taskId_tagId_key" ON "TaskTag" USING btree ("taskId","tagId");--> statement-breakpoint
CREATE INDEX "TaskTag_taskId_idx" ON "TaskTag" USING btree ("taskId");--> statement-breakpoint
CREATE INDEX "TaskTag_tagId_idx" ON "TaskTag" USING btree ("tagId");