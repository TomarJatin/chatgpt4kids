DO $$ BEGIN
 CREATE TYPE "public"."filter_level_enum" AS ENUM('low', 'medium', 'high');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."persona_type" AS ENUM('parent', 'child');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ChatTopic" (
	"chatId" uuid NOT NULL,
	"topicId" uuid NOT NULL,
	"relevanceScore" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ChatTopic_chatId_topicId_pk" PRIMARY KEY("chatId","topicId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "EducationalSuggestion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personaId" uuid NOT NULL,
	"suggestion" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "FavoriteTopic" (
	"personaId" uuid NOT NULL,
	"topicId" uuid NOT NULL,
	CONSTRAINT "FavoriteTopic_personaId_topicId_pk" PRIMARY KEY("personaId","topicId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "FlaggedMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid NOT NULL,
	"flaggedByPersonaId" uuid NOT NULL,
	"reason" varchar NOT NULL,
	"details" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Persona" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" "persona_type" NOT NULL,
	"displayName" varchar(64) NOT NULL,
	"pinHash" varchar(128),
	"parentPersonaId" uuid,
	"avatar" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PersonaSettings" (
	"personaId" uuid PRIMARY KEY NOT NULL,
	"topicRestriction" "filter_level_enum" DEFAULT 'medium' NOT NULL,
	"violenceFilterLevel" "filter_level_enum" DEFAULT 'low' NOT NULL,
	"politicsFilterLevel" "filter_level_enum" DEFAULT 'low' NOT NULL,
	"homeworkMode" boolean DEFAULT false NOT NULL,
	"wordFilteringEnabled" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Topic" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL,
	"deletedAt" timestamp,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UsageReport" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personaId" uuid NOT NULL,
	"date" date NOT NULL,
	"chatsStarted" integer DEFAULT 0 NOT NULL,
	"messagesSent" integer DEFAULT 0 NOT NULL,
	"wordsSent" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ux_usage_report_persona_date" UNIQUE("personaId","date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "WordFilter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personaId" uuid NOT NULL,
	"word" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "personaId" uuid;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatTopic" ADD CONSTRAINT "ChatTopic_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatTopic" ADD CONSTRAINT "ChatTopic_topicId_Topic_id_fk" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "EducationalSuggestion" ADD CONSTRAINT "EducationalSuggestion_personaId_Persona_id_fk" FOREIGN KEY ("personaId") REFERENCES "public"."Persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "FavoriteTopic" ADD CONSTRAINT "FavoriteTopic_personaId_Persona_id_fk" FOREIGN KEY ("personaId") REFERENCES "public"."Persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "FavoriteTopic" ADD CONSTRAINT "FavoriteTopic_topicId_Topic_id_fk" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "FlaggedMessage" ADD CONSTRAINT "FlaggedMessage_messageId_Message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "FlaggedMessage" ADD CONSTRAINT "FlaggedMessage_flaggedByPersonaId_Persona_id_fk" FOREIGN KEY ("flaggedByPersonaId") REFERENCES "public"."Persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Persona" ADD CONSTRAINT "Persona_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Persona" ADD CONSTRAINT "Persona_parentPersonaId_Persona_id_fk" FOREIGN KEY ("parentPersonaId") REFERENCES "public"."Persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PersonaSettings" ADD CONSTRAINT "PersonaSettings_personaId_Persona_id_fk" FOREIGN KEY ("personaId") REFERENCES "public"."Persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UsageReport" ADD CONSTRAINT "UsageReport_personaId_Persona_id_fk" FOREIGN KEY ("personaId") REFERENCES "public"."Persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "WordFilter" ADD CONSTRAINT "WordFilter_personaId_Persona_id_fk" FOREIGN KEY ("personaId") REFERENCES "public"."Persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_educational_suggestion_persona" ON "EducationalSuggestion" USING btree ("personaId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_educational_suggestion_created" ON "EducationalSuggestion" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_parent" ON "Persona" USING btree ("parentPersonaId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usage_report_date" ON "UsageReport" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usage_report_persona" ON "UsageReport" USING btree ("personaId");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_personaId_Persona_id_fk" FOREIGN KEY ("personaId") REFERENCES "public"."Persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
