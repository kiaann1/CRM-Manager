-- Run this in Neon / psql if bootstrap fails with "column does not exist" after pulling newer code.
-- Preferred: from repo root →  npm run db:push --prefix server
--
-- Bootstrap's first query loads Membership + User (all scalar columns) + UserPreference + Organization.productCatalogToken.
-- Any mismatch triggers Prisma P2022; add missing columns here until `npm run db:push` works from your machine.

-- Regional prefs (UserPreference)
ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en-US';
ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- User (loaded with membership; SSO + profile fields sometimes added after first deploy)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "oauthProvider" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "oauthSubject" TEXT;

-- Membership (optional team / territory assignment)
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "teamId" TEXT;
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "territoryId" TEXT;

-- Public catalog token (Organization)
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "productCatalogToken" TEXT;

-- Nullable unique catalog token (matches Prisma @unique)
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_productCatalogToken_key"
  ON "Organization" ("productCatalogToken");

-- Product (ERP / catalog fields — older DBs often only had id, organizationId, name, sku, price)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "unitOfMeasure" TEXT NOT NULL DEFAULT 'ea';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cost" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "barcode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "specifications" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Product_organizationId_status_idx"
  ON "Product" ("organizationId", "status");
CREATE INDEX IF NOT EXISTS "Product_organizationId_sku_idx"
  ON "Product" ("organizationId", "sku");
