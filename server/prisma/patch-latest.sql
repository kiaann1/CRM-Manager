-- Quick patch for the latest app features (run in Neon SQL if bootstrap fails on Notification / SavedView).
-- Full history: fix-bootstrap-columns.sql

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "linkPath" TEXT;

CREATE TABLE IF NOT EXISTS "SavedView" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  "entityType" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "viewType" TEXT NOT NULL DEFAULT 'table',
  "filters" JSONB NOT NULL,
  "shared" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SavedView_organizationId_entityType_idx"
  ON "SavedView" ("organizationId", "entityType");

-- Task multi-assignee (many-to-many)
CREATE TABLE IF NOT EXISTS "TaskAssignee" (
  "taskId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("taskId", "userId")
);
CREATE INDEX IF NOT EXISTS "TaskAssignee_userId_idx" ON "TaskAssignee" ("userId");
DO $$ BEGIN
  ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
INSERT INTO "TaskAssignee" ("taskId", "userId")
SELECT t.id, t."ownerId" FROM "Task" t
WHERE NOT EXISTS (
  SELECT 1 FROM "TaskAssignee" ta WHERE ta."taskId" = t.id
);
