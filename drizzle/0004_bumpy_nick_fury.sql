CREATE TABLE IF NOT EXISTS "lite_users_data" (
	"doc_id" integer NOT NULL,
	"field" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lite_users_data" ADD CONSTRAINT "lite_users_data_doc_id_lite_users_id_fk" FOREIGN KEY ("doc_id") REFERENCES "lite_users"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
