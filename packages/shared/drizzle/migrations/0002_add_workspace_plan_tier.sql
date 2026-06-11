ALTER TABLE "workspaces" ADD COLUMN "plan_tier" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "stripe_subscription_id" text;