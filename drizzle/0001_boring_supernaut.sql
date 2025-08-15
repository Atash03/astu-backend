CREATE TABLE IF NOT EXISTS "periodic_task_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"active" boolean NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "periodic_task_info_data" (
	"doc_id" integer NOT NULL,
	"field" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "periodic_task_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_name" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_document" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_document_data" (
	"doc_id" integer NOT NULL,
	"field" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "top_up" (
	"id" serial PRIMARY KEY NOT NULL,
	"top_up_group_id" integer,
	"plugin_info_name" varchar,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"phone_number" varchar,
	"service_type" varchar,
	"internal_receipt" varchar,
	"provider_receipt" varchar,
	"amount" integer NOT NULL,
	"status" varchar NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "top_up_data" (
	"doc_id" integer NOT NULL,
	"field" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "top_up_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"phone_number" varchar,
	"rts_payment_id" integer,
	"rts_payment_receipt" varchar,
	"rts_payment_status" varchar,
	"amount" integer NOT NULL,
	"description" varchar,
	"lite_user_id" integer,
	"status" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "top_up_group_data" (
	"doc_id" integer NOT NULL,
	"field" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "top_up_plugin_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"active" boolean NOT NULL,
	"plugin" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "top_up_plugin_info_data" (
	"doc_id" integer NOT NULL,
	"field" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "topup_transaction_details" DROP CONSTRAINT "topup_transaction_details_topup_transaction_id_fkey";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "ar_internal_metadata" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "gts_users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "lite_notifications" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "lite_otp" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "lite_users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "topup_transaction_details" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "topup_transactions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "periodic_task_name_key" ON "periodic_task_info" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "periodic_task_data_field_key" ON "periodic_task_info_data" ("doc_id","field");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "test_document_data_doc_id_field_key" ON "test_document_data" ("doc_id","field");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topup_group_id_idx" ON "top_up" ("top_up_group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_top_up_created_at_idx" ON "top_up" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "top_up_data_doc_id_field_key" ON "top_up_data" ("doc_id","field");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_top_up_group_status" ON "top_up_group" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_top_up_rts_payment_status" ON "top_up_group" ("rts_payment_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_top_up_created_at" ON "top_up_group" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "top_up_group_doc_id_field_key" ON "top_up_group_data" ("doc_id","field");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "topup_plugin_info_name_key" ON "top_up_plugin_info" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "topup_plugin_info_data_doc_id_field_key" ON "top_up_plugin_info_data" ("doc_id","field");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lite_otp_device_id" ON "lite_otp" ("device_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "topup_transaction_details" ADD CONSTRAINT "topup_transaction_details_topup_transaction_id_topup_transactions_id_fk" FOREIGN KEY ("topup_transaction_id") REFERENCES "topup_transactions"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "periodic_task_info_data" ADD CONSTRAINT "periodic_task_info_data_doc_id_periodic_task_info_id_fk" FOREIGN KEY ("doc_id") REFERENCES "periodic_task_info"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_document_data" ADD CONSTRAINT "test_document_data_doc_id_test_document_id_fk" FOREIGN KEY ("doc_id") REFERENCES "test_document"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "top_up" ADD CONSTRAINT "top_up_top_up_group_id_top_up_group_id_fk" FOREIGN KEY ("top_up_group_id") REFERENCES "top_up_group"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "top_up" ADD CONSTRAINT "top_up_plugin_info_name_top_up_plugin_info_name_fk" FOREIGN KEY ("plugin_info_name") REFERENCES "top_up_plugin_info"("name") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "top_up_data" ADD CONSTRAINT "top_up_data_doc_id_top_up_id_fk" FOREIGN KEY ("doc_id") REFERENCES "top_up"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "top_up_group" ADD CONSTRAINT "top_up_group_lite_user_id_lite_users_id_fk" FOREIGN KEY ("lite_user_id") REFERENCES "lite_users"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "top_up_group_data" ADD CONSTRAINT "top_up_group_data_doc_id_top_up_group_id_fk" FOREIGN KEY ("doc_id") REFERENCES "top_up_group"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "top_up_plugin_info_data" ADD CONSTRAINT "top_up_plugin_info_data_doc_id_top_up_plugin_info_id_fk" FOREIGN KEY ("doc_id") REFERENCES "top_up_plugin_info"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
