CREATE TABLE "ProjectMember" (
	"projectId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Project" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember" USING btree ("projectId","userId");--> statement-breakpoint
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "Project_organizationId_name_key" ON "Project" USING btree ("organizationId","name");--> statement-breakpoint
CREATE INDEX "Project_organizationId_idx" ON "Project" USING btree ("organizationId");