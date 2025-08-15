ALTER TABLE "lite_notifications" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "lite_otp" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "lite_users" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "lite_users" ADD COLUMN "updated_at" timestamp (3) DEFAULT now() NOT NULL;