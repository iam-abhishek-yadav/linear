CREATE TYPE "public"."CodeSnippetLanguage" AS ENUM('react', 'next', 'typescript', 'javascript', 'fastapi', 'python');--> statement-breakpoint
CREATE TABLE "CodeSnippet" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"authorId" text NOT NULL,
	"recipientId" text NOT NULL,
	"title" text,
	"language" "CodeSnippetLanguage" NOT NULL,
	"body" text NOT NULL,
	"readAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "CodeSnippet" ADD CONSTRAINT "CodeSnippet_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CodeSnippet" ADD CONSTRAINT "CodeSnippet_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CodeSnippet" ADD CONSTRAINT "CodeSnippet_recipientId_User_id_fk" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "CodeSnippet_organizationId_createdAt_idx" ON "CodeSnippet" USING btree ("organizationId","createdAt");--> statement-breakpoint
CREATE INDEX "CodeSnippet_recipientId_readAt_idx" ON "CodeSnippet" USING btree ("recipientId","readAt");--> statement-breakpoint
CREATE INDEX "CodeSnippet_authorId_idx" ON "CodeSnippet" USING btree ("authorId");