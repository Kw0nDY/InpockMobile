CREATE TABLE "link_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_id" integer NOT NULL,
	"visitor_ip" text NOT NULL,
	"user_agent" text,
	"referrer" text,
	"is_owner" boolean DEFAULT false,
	"visited_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "style" text DEFAULT 'thumbnail';--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "custom_image_url" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "crop_data" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "background_theme" text DEFAULT 'beige';--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "show_profile_image" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "show_bio" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "show_visit_count" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "layout_style" text DEFAULT 'centered';--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "instagram_url" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "twitter_url" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "youtube_url" text;--> statement-breakpoint
ALTER TABLE "link_visits" ADD CONSTRAINT "link_visits_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE no action ON UPDATE no action;