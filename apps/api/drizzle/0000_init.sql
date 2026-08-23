CREATE TYPE "public"."audit_operation" AS ENUM('INSERT', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"avatar_url" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"table_name" varchar(50) NOT NULL,
	"operation" "audit_operation" NOT NULL,
	"db_user" varchar(63) NOT NULL,
	"app_user_id" varchar(100),
	"action_at" timestamp with time zone DEFAULT now() NOT NULL,
	"record_id" varchar(100),
	"old_value" jsonb,
	"new_value" jsonb
);
--> statement-breakpoint
CREATE TABLE "channel" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"position" integer DEFAULT 0 NOT NULL,
	"guild_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon_url" varchar(500),
	"is_public" boolean DEFAULT false NOT NULL,
	"owner_id" uuid NOT NULL,
	"description" varchar(300)
);
--> statement-breakpoint
CREATE TABLE "guild_users" (
	"guild_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "guild_users_guild_id_user_id_pk" PRIMARY KEY("guild_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content" varchar(2000) NOT NULL,
	"author_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_guild_id_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guild"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild" ADD CONSTRAINT "guild_owner_id_app_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_users" ADD CONSTRAINT "guild_users_guild_id_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guild"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_users" ADD CONSTRAINT "guild_users_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_author_id_app_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_user_email_idx" ON "app_user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "audit_log_table_action_at_idx" ON "audit_log" USING btree ("table_name","action_at");--> statement-breakpoint
CREATE INDEX "audit_log_record_id_idx" ON "audit_log" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "channel_guild_id_position_idx" ON "channel" USING btree ("guild_id","position");--> statement-breakpoint
CREATE INDEX "guild_owner_id_idx" ON "guild" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "guild_is_public_idx" ON "guild" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "guild_users_user_id_idx" ON "guild_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "message_channel_id_created_at_idx" ON "message" USING btree ("channel_id","created_at");