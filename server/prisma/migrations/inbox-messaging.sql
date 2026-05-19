-- Run in Neon SQL editor if `npm run db:push` cannot reach the database from your machine.
-- Adds team/DM messaging columns to InboxMessage.

ALTER TABLE "InboxMessage" ADD COLUMN IF NOT EXISTS "senderId" TEXT;
ALTER TABLE "InboxMessage" ADD COLUMN IF NOT EXISTS "recipientUserId" TEXT;
ALTER TABLE "InboxMessage" ADD COLUMN IF NOT EXISTS "readByUserIds" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "InboxMessage" ALTER COLUMN "teamId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "InboxMessage_recipientUserId_idx" ON "InboxMessage"("recipientUserId");
CREATE INDEX IF NOT EXISTS "InboxMessage_senderId_idx" ON "InboxMessage"("senderId");
CREATE INDEX IF NOT EXISTS "InboxMessage_teamId_idx" ON "InboxMessage"("teamId");
