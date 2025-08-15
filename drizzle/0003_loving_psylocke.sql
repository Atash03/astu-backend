ALTER TABLE "periodic_task_log" ADD COLUMN "function_name" text;--> statement-breakpoint
ALTER TABLE "top_up_group" ADD COLUMN "retries" integer DEFAULT 0;