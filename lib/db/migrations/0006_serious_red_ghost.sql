CREATE TABLE IF NOT EXISTS "MessageUsage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"usage" jsonb NOT NULL
);
