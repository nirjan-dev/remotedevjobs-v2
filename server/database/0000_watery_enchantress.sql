CREATE TABLE "benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "benefits_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "durations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "durations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "experience_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "experience_levels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "job_queues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"job_details" jsonb NOT NULL,
	"link" text NOT NULL,
	CONSTRAINT "job_queues_link_unique" UNIQUE("link")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"slug" text NOT NULL,
	"link" text NOT NULL,
	"salary" text NOT NULL,
	"posted_at" timestamp NOT NULL,
	"company_id" uuid NOT NULL,
	"duration_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"experience_level_id" uuid NOT NULL,
	CONSTRAINT "jobs_slug_unique" UNIQUE("slug"),
	CONSTRAINT "jobs_link_unique" UNIQUE("link")
);
--> statement-breakpoint
CREATE TABLE "jobs_to_benefits" (
	"job_id" uuid NOT NULL,
	"benefit_id" uuid NOT NULL,
	CONSTRAINT "jobs_to_benefits_job_id_benefit_id_pk" PRIMARY KEY("job_id","benefit_id")
);
--> statement-breakpoint
CREATE TABLE "jobs_to_locations" (
	"job_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	CONSTRAINT "jobs_to_locations_job_id_location_id_pk" PRIMARY KEY("job_id","location_id")
);
--> statement-breakpoint
CREATE TABLE "jobs_to_tags" (
	"job_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "jobs_to_tags_job_id_tag_id_pk" PRIMARY KEY("job_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "locations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_duration_id_durations_id_fk" FOREIGN KEY ("duration_id") REFERENCES "public"."durations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_experience_level_id_experience_levels_id_fk" FOREIGN KEY ("experience_level_id") REFERENCES "public"."experience_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs_to_benefits" ADD CONSTRAINT "jobs_to_benefits_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs_to_benefits" ADD CONSTRAINT "jobs_to_benefits_benefit_id_benefits_id_fk" FOREIGN KEY ("benefit_id") REFERENCES "public"."benefits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs_to_locations" ADD CONSTRAINT "jobs_to_locations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs_to_locations" ADD CONSTRAINT "jobs_to_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs_to_tags" ADD CONSTRAINT "jobs_to_tags_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs_to_tags" ADD CONSTRAINT "jobs_to_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;