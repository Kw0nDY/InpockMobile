CREATE TABLE IF NOT EXISTS "link_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_id" integer NOT NULL,
	"visitor_ip" text NOT NULL,
	"user_agent" text,
	"referrer" text,
	"is_owner" boolean DEFAULT false,
	"visited_at" timestamp DEFAULT now()
);

ALTER TABLE "link_visits" ADD CONSTRAINT "link_visits_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE no action ON UPDATE no action;