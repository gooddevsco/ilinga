CREATE TABLE "cookie_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"anon_id" text,
	"policy_version_hash" text NOT NULL,
	"categories" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "failed_login_counters" (
	"email" text PRIMARY KEY NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_magic_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"purpose" text NOT NULL,
	"request_ip" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_oauth_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"subject" text NOT NULL,
	"raw_profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"device_fingerprint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"absolute_expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_trusted_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fingerprint_hash" text NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"label" text,
	"impossible_travel_flagged" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_normalized" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"locale" text DEFAULT 'en-GB' NOT NULL,
	"ui_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "api_request_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"actor_user_id" uuid,
	"api_token_id" uuid,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"status" integer NOT NULL,
	"latency_ms" integer NOT NULL,
	"request_id" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deletion_tombstones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"target_table" text NOT NULL,
	"target_id" uuid NOT NULL,
	"deleted_by" uuid NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"restore_deadline" timestamp with time zone NOT NULL,
	"hard_deleted_at" timestamp with time zone,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dsar_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid,
	"kind" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_admin_id" uuid,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "impersonation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"impersonated_user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"ip" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "maintenance_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"message" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"affects_components" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"suspended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_ownership_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"region" text DEFAULT 'eu' NOT NULL,
	"industry" text,
	"country_code" text,
	"brand_logo_url" text,
	"brand_accent_hex" text,
	"custom_domain" text,
	"custom_domain_verified_at" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "artifact_scans" (
	"artifact_id" uuid PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"scanned_at" timestamp with time zone,
	"signature_db_version" text,
	"threat_name" text
);
--> statement-breakpoint
CREATE TABLE "comment_mentions" (
	"comment_id" uuid NOT NULL,
	"mentioned_user_id" uuid NOT NULL,
	"notified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid,
	"target_table" text NOT NULL,
	"target_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"url" text NOT NULL,
	"label" text,
	"scrape_status" text DEFAULT 'queued' NOT NULL,
	"scraped_at" timestamp with time zone,
	"extraction_text" text,
	"structured" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"added_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cycle_presence" (
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"location" text
);
--> statement-breakpoint
CREATE TABLE "question_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answered_by" uuid NOT NULL,
	"raw_value" jsonb,
	"notes" text,
	"skipped" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"cluster" text NOT NULL,
	"label" text NOT NULL,
	"help_text" text,
	"input_type" text DEFAULT 'text' NOT NULL,
	"options" jsonb,
	"sequence" integer NOT NULL,
	"is_core" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stakeholder_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stakeholder_id" uuid NOT NULL,
	"question_id" uuid,
	"raw_value" jsonb,
	"free_text" text,
	"uploaded_artifact_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stakeholders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"email" text NOT NULL,
	"label" text,
	"token_hash" text NOT NULL,
	"invited_by" uuid NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"opted_out_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text,
	"size_bytes" integer,
	"s3_key" text NOT NULL,
	"extraction_status" text DEFAULT 'pending' NOT NULL,
	"extraction_text" text,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "venture_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"venture_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"frozen_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ventures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"geos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"brief" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "answer_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"answer_id" uuid NOT NULL,
	"embedding" vector(1024) NOT NULL,
	"ai_model_id" uuid
);
--> statement-breakpoint
CREATE TABLE "artifact_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"artifact_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"chunk_text" text NOT NULL,
	"embedding" vector(1024) NOT NULL,
	"ai_model_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_key_pins" (
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"code" text NOT NULL,
	"pinned_by" uuid NOT NULL,
	"pinned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"code" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"value" jsonb NOT NULL,
	"confidence" integer,
	"source" text NOT NULL,
	"source_module_id" uuid,
	"source_prompt_run_id" uuid,
	"superseded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cycle_event_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"happens_after" text,
	"cancelled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"code" text NOT NULL,
	"cluster" text NOT NULL,
	"label" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"ai_workload" text NOT NULL,
	"prompt_template" text NOT NULL,
	"input_context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"credit_cost" integer DEFAULT 1 NOT NULL,
	"queued_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text
);
--> statement-breakpoint
CREATE TABLE "prompt_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"module_id" uuid,
	"ai_endpoint_id" uuid,
	"ai_model_id" uuid,
	"workload" text NOT NULL,
	"prompt_hash" text NOT NULL,
	"prompt_text" text,
	"completion_text" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"latency_ms" integer,
	"error_message" text,
	"cancelled_at" timestamp with time zone,
	"credits_charged" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reducer_verdicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"code" text NOT NULL,
	"candidates" jsonb NOT NULL,
	"chosen" jsonb NOT NULL,
	"rationale" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_renders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"report_id" uuid NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"html_s3_key" text,
	"pdf_s3_key" text,
	"credits_charged" integer DEFAULT 0 NOT NULL,
	"forced" boolean DEFAULT false NOT NULL,
	"page_count" integer,
	"queued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"failure_reason" text
);
--> statement-breakpoint
CREATE TABLE "report_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"report_id" uuid NOT NULL,
	"cron" text NOT NULL,
	"next_run_at" timestamp with time zone NOT NULL,
	"last_run_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paused_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "report_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"code" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"handlebars_html" text NOT NULL,
	"handlebars_mjml" text,
	"required_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"credit_cost" integer DEFAULT 0 NOT NULL,
	"pricing_tier" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deprecated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"title" text NOT NULL,
	"input_key_snapshot" jsonb NOT NULL,
	"keys_hash" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_topups" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"threshold_credits" integer DEFAULT 50 NOT NULL,
	"pack_code" text NOT NULL,
	"monthly_cap_cents" integer,
	"spent_this_period_cents" integer DEFAULT 0 NOT NULL,
	"period_resets_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"percent_off" integer,
	"amount_off_cents" integer,
	"duration_months" integer,
	"max_redemptions" integer,
	"redeemed" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reason" text NOT NULL,
	"ref_type" text,
	"ref_id" uuid,
	"dodo_event_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"credits" integer NOT NULL,
	"usd_cents" integer NOT NULL,
	"dodo_product_id" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credits" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"monthly_allowance" integer DEFAULT 0 NOT NULL,
	"allowance_resets_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"dodo_invoice_id" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"pdf_s3_key" text,
	"company_name" text,
	"vat_id" text,
	"status" text DEFAULT 'paid' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"display_name" text NOT NULL,
	"monthly_usd_cents" integer NOT NULL,
	"monthly_credits" integer NOT NULL,
	"seats" integer NOT NULL,
	"dodo_product_id" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" text DEFAULT 'trialing' NOT NULL,
	"dodo_subscription_id" text,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_model_aliases" (
	"alias" text NOT NULL,
	"tenant_id" uuid,
	"model_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"provider" text NOT NULL,
	"family" text NOT NULL,
	"model_id" text NOT NULL,
	"display_name" text NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"context_window" integer,
	"max_output_tokens" integer,
	"cost_per_million_input_cents" integer,
	"cost_per_million_output_cents" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_ai_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"label" text NOT NULL,
	"base_url" text,
	"api_key_ciphertext" "bytea" NOT NULL,
	"api_key_dek_id" uuid NOT NULL,
	"api_key_last_four" text,
	"workloads" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tenant_deks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"wrapped_dek" "bytea" NOT NULL,
	"kek_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rotated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"label" text NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "n8n_workflow_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"json" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "n8n_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"n8n_id" text NOT NULL,
	"label" text NOT NULL,
	"purpose" text NOT NULL,
	"active_revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"endpoint_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"request_signature" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_response_status" integer,
	"last_response_body" text,
	"next_attempt_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"url" text NOT NULL,
	"secret_ciphertext" "bytea" NOT NULL,
	"secret_dek_id" uuid NOT NULL,
	"previous_secret_ciphertext" "bytea",
	"previous_secret_valid_until" timestamp with time zone,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "email_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"user_id" uuid,
	"template" text NOT NULL,
	"subject" text,
	"to_email" text NOT NULL,
	"from_email" text NOT NULL,
	"provider" text NOT NULL,
	"provider_message_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"reason" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"rollout_percent" integer DEFAULT 0 NOT NULL,
	"tenant_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_admins" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_incident_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"body" text NOT NULL,
	"status" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"severity" text NOT NULL,
	"status" text DEFAULT 'investigating' NOT NULL,
	"affects_components" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"summary" text,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"user_id" uuid,
	"template" text NOT NULL,
	"to_number" text NOT NULL,
	"from_number" text NOT NULL,
	"body" text NOT NULL,
	"provider" text NOT NULL,
	"provider_message_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"segments" integer,
	"cost_cents" integer,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"seq" bigserial PRIMARY KEY NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"actor_user_id" uuid,
	"impersonator_user_id" uuid,
	"action" text NOT NULL,
	"target_table" text,
	"target_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" text,
	"user_agent" text,
	"request_id" text,
	"prev_hash" "bytea",
	"row_hash" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cookie_consents_user_id_idx" ON "cookie_consents" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "cookie_consents_anon_id_idx" ON "cookie_consents" USING btree ("anon_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_magic_links_token_hash_uniq" ON "user_magic_links" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "user_magic_links_email_idx" ON "user_magic_links" USING btree ("email","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_oauth_identities_provider_subject_uniq" ON "user_oauth_identities" USING btree ("provider","subject");--> statement-breakpoint
CREATE INDEX "user_oauth_identities_user_id_idx" ON "user_oauth_identities" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_sessions_token_hash_uniq" ON "user_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_trusted_devices_user_fp_uniq" ON "user_trusted_devices" USING btree ("user_id","fingerprint_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_normalized_uniq" ON "users" USING btree ("email_normalized");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "api_request_log_tenant_idx" ON "api_request_log" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "deletion_tombstones_deadline_idx" ON "deletion_tombstones" USING btree ("tenant_id","target_table","restore_deadline");--> statement-breakpoint
CREATE UNIQUE INDEX "deletion_tombstones_target_uniq" ON "deletion_tombstones" USING btree ("target_table","target_id");--> statement-breakpoint
CREATE INDEX "dsar_requests_status_idx" ON "dsar_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "impersonation_sessions_tenant_idx" ON "impersonation_sessions" USING btree ("tenant_id","started_at");--> statement-breakpoint
CREATE INDEX "impersonation_sessions_admin_idx" ON "impersonation_sessions" USING btree ("admin_user_id","started_at");--> statement-breakpoint
CREATE INDEX "maintenance_windows_window_idx" ON "maintenance_windows" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_invites_token_hash_uniq" ON "tenant_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "tenant_invites_tenant_email_idx" ON "tenant_invites" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_members_tenant_user_uniq" ON "tenant_members" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "tenant_members_user_id_idx" ON "tenant_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenant_ownership_transfers_tenant_idx" ON "tenant_ownership_transfers" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_slug_uniq" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_custom_domain_uniq" ON "tenants" USING btree ("custom_domain");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_mentions_uniq" ON "comment_mentions" USING btree ("comment_id","mentioned_user_id");--> statement-breakpoint
CREATE INDEX "comments_target_idx" ON "comments" USING btree ("tenant_id","target_table","target_id","created_at");--> statement-breakpoint
CREATE INDEX "competitors_cycle_idx" ON "competitors" USING btree ("cycle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cycle_presence_uniq" ON "cycle_presence" USING btree ("tenant_id","cycle_id","user_id");--> statement-breakpoint
CREATE INDEX "cycle_presence_cycle_idx" ON "cycle_presence" USING btree ("cycle_id","last_seen_at");--> statement-breakpoint
CREATE UNIQUE INDEX "question_answers_cycle_question_uniq" ON "question_answers" USING btree ("cycle_id","question_id");--> statement-breakpoint
CREATE INDEX "question_answers_tenant_idx" ON "question_answers" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "questions_code_uniq" ON "questions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "stakeholder_responses_stakeholder_idx" ON "stakeholder_responses" USING btree ("stakeholder_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stakeholders_token_hash_uniq" ON "stakeholders" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "stakeholders_cycle_idx" ON "stakeholders" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "venture_artifacts_cycle_idx" ON "venture_artifacts" USING btree ("cycle_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "venture_cycles_tenant_idx" ON "venture_cycles" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "venture_cycles_venture_seq_uniq" ON "venture_cycles" USING btree ("venture_id","seq");--> statement-breakpoint
CREATE INDEX "ventures_tenant_idx" ON "ventures" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "answer_embeddings_answer_uniq" ON "answer_embeddings" USING btree ("answer_id");--> statement-breakpoint
CREATE INDEX "answer_embeddings_cycle_idx" ON "answer_embeddings" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "artifact_embeddings_cycle_idx" ON "artifact_embeddings" USING btree ("cycle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "artifact_embeddings_artifact_chunk_uniq" ON "artifact_embeddings" USING btree ("artifact_id","chunk_index");--> statement-breakpoint
CREATE UNIQUE INDEX "content_key_pins_uniq" ON "content_key_pins" USING btree ("tenant_id","cycle_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "content_keys_cycle_code_version_uniq" ON "content_keys" USING btree ("cycle_id","code","version");--> statement-breakpoint
CREATE INDEX "content_keys_cycle_idx" ON "content_keys" USING btree ("cycle_id","code");--> statement-breakpoint
CREATE INDEX "cycle_event_log_cycle_idx" ON "cycle_event_log" USING btree ("cycle_id","created_at");--> statement-breakpoint
CREATE INDEX "modules_cycle_status_idx" ON "modules" USING btree ("cycle_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "modules_cycle_code_uniq" ON "modules" USING btree ("cycle_id","code");--> statement-breakpoint
CREATE INDEX "prompt_runs_module_idx" ON "prompt_runs" USING btree ("module_id","created_at");--> statement-breakpoint
CREATE INDEX "prompt_runs_cycle_idx" ON "prompt_runs" USING btree ("cycle_id","created_at");--> statement-breakpoint
CREATE INDEX "reducer_verdicts_cycle_idx" ON "reducer_verdicts" USING btree ("cycle_id","code");--> statement-breakpoint
CREATE INDEX "report_renders_report_idx" ON "report_renders" USING btree ("report_id","queued_at");--> statement-breakpoint
CREATE INDEX "report_renders_status_idx" ON "report_renders" USING btree ("status","queued_at");--> statement-breakpoint
CREATE INDEX "report_schedules_next_run_idx" ON "report_schedules" USING btree ("next_run_at");--> statement-breakpoint
CREATE UNIQUE INDEX "report_templates_code_version_uniq" ON "report_templates" USING btree ("code","version");--> statement-breakpoint
CREATE INDEX "reports_cycle_idx" ON "reports" USING btree ("cycle_id","created_at");--> statement-breakpoint
CREATE INDEX "reports_keys_hash_idx" ON "reports" USING btree ("tenant_id","template_id","keys_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_redemptions_uniq" ON "coupon_redemptions" USING btree ("tenant_id","coupon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code_uniq" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "credit_ledger_tenant_idx" ON "credit_ledger" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_ledger_dodo_event_uniq" ON "credit_ledger" USING btree ("dodo_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_packs_code_uniq" ON "credit_packs" USING btree ("code");--> statement-breakpoint
CREATE INDEX "invoices_tenant_idx" ON "invoices" USING btree ("tenant_id","issued_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_dodo_invoice_uniq" ON "invoices" USING btree ("dodo_invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_code_uniq" ON "plans" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_tenant_uniq" ON "subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_model_aliases_uniq" ON "ai_model_aliases" USING btree ("alias","tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_models_provider_model_uniq" ON "ai_models" USING btree ("tenant_id","provider","model_id");--> statement-breakpoint
CREATE INDEX "ai_models_provider_idx" ON "ai_models" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "tenant_ai_endpoints_tenant_idx" ON "tenant_ai_endpoints" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "tenant_ai_endpoints_workload_idx" ON "tenant_ai_endpoints" USING btree ("tenant_id","workloads");--> statement-breakpoint
CREATE INDEX "tenant_deks_tenant_idx" ON "tenant_deks" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "api_tokens_token_hash_uniq" ON "api_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "api_tokens_tenant_idx" ON "api_tokens" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "n8n_workflow_revisions_uniq" ON "n8n_workflow_revisions" USING btree ("workflow_id","revision");--> statement-breakpoint
CREATE UNIQUE INDEX "n8n_workflows_n8n_id_uniq" ON "n8n_workflows" USING btree ("n8n_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_endpoint_idx" ON "webhook_deliveries" USING btree ("endpoint_id","created_at");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "webhook_endpoints_tenant_idx" ON "webhook_endpoints" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "email_messages_to_idx" ON "email_messages" USING btree ("to_email","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_suppressions_email_uniq" ON "email_suppressions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "platform_incident_updates_incident_idx" ON "platform_incident_updates" USING btree ("incident_id","created_at");--> statement-breakpoint
CREATE INDEX "platform_incidents_status_idx" ON "platform_incidents" USING btree ("status","started_at");--> statement-breakpoint
CREATE INDEX "sms_messages_to_idx" ON "sms_messages" USING btree ("to_number","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_tenant_idx" ON "audit_log" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_target_idx" ON "audit_log" USING btree ("target_table","target_id");