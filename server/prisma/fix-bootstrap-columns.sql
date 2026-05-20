-- Run this in Neon / psql if bootstrap fails with "column does not exist" after pulling newer code.
-- Preferred: from repo root →  npm run db:push --prefix server

-- Regional prefs (UserPreference)
ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en-US';
ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- Public catalog token (Organization)
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "productCatalogToken" TEXT;

-- Nullable unique catalog token (matches Prisma @unique)
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_productCatalogToken_key"
  ON "Organization" ("productCatalogToken");
