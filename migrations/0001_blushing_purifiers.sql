ALTER TABLE "media_uploads" ALTER COLUMN "file_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "media_uploads" ALTER COLUMN "original_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "media_uploads" ALTER COLUMN "mime_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "media_uploads" ALTER COLUMN "file_size" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "media_uploads" ALTER COLUMN "file_path" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "media_uploads" ADD COLUMN "media_url" text;