CREATE TABLE "PasswordResetOtp" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"otpHash" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"usedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" timestamp (3);--> statement-breakpoint
ALTER TABLE "PasswordResetOtp" ADD CONSTRAINT "PasswordResetOtp_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "PasswordResetOtp_userId_createdAt_idx" ON "PasswordResetOtp" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "User_phone_key" ON "User" USING btree ("phone");