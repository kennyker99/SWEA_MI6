CREATE TABLE "analysis_records" (
	"id" text PRIMARY KEY NOT NULL,
	"pair" text NOT NULL,
	"timeframe" text NOT NULL,
	"date" text NOT NULL,
	"indicators" jsonb NOT NULL,
	"verdict" jsonb NOT NULL,
	"chart_image" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
