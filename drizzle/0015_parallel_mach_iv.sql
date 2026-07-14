CREATE TABLE "SavedView" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"createdById" text NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "SavedView_organizationId_idx" ON "SavedView" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "SavedView_createdById_idx" ON "SavedView" USING btree ("createdById");