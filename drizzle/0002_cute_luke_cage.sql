ALTER TYPE "public"."UserRole" ADD VALUE 'MEMBER';--> statement-breakpoint
CREATE TABLE "MemberInvite" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"token" text NOT NULL,
	"email" text NOT NULL,
	"invitedByUserId" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"acceptedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "MemberInvite" ADD CONSTRAINT "MemberInvite_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "MemberInvite" ADD CONSTRAINT "MemberInvite_invitedByUserId_User_id_fk" FOREIGN KEY ("invitedByUserId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "MemberInvite_token_key" ON "MemberInvite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "MemberInvite_organizationId_idx" ON "MemberInvite" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "MemberInvite_email_idx" ON "MemberInvite" USING btree ("email");