CREATE TYPE "public"."ProjectAccessRequestStatus" AS ENUM('PENDING', 'APPROVED', 'DENIED');--> statement-breakpoint
CREATE TABLE "ProjectAccessRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"userId" text NOT NULL,
	"status" "ProjectAccessRequestStatus" DEFAULT 'PENDING' NOT NULL,
	"reviewedById" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"reviewedAt" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "ProjectAccessRequest" ADD CONSTRAINT "ProjectAccessRequest_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectAccessRequest" ADD CONSTRAINT "ProjectAccessRequest_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectAccessRequest" ADD CONSTRAINT "ProjectAccessRequest_reviewedById_User_id_fk" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ProjectAccessRequest_projectId_userId_key" ON "ProjectAccessRequest" USING btree ("projectId","userId");--> statement-breakpoint
CREATE INDEX "ProjectAccessRequest_projectId_status_idx" ON "ProjectAccessRequest" USING btree ("projectId","status");--> statement-breakpoint
CREATE INDEX "ProjectAccessRequest_userId_idx" ON "ProjectAccessRequest" USING btree ("userId");