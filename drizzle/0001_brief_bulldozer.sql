CREATE TABLE "OrgInvite" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"email" text,
	"expiresAt" timestamp (3) NOT NULL,
	"acceptedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "OrgInvite_token_key" ON "OrgInvite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "OrgInvite_email_idx" ON "OrgInvite" USING btree ("email");