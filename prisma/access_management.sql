-- Phase 1: organization + membership access model
--
-- This migration is intentionally additive. The legacy UserRole/companyId
-- fields are retained for one transition period so existing CRM code does
-- not break while authorization moves to Membership.

BEGIN;

CREATE TYPE "OrganizationType" AS ENUM ('INTERNAL', 'CLIENT');

CREATE TYPE "MembershipRole" AS ENUM (
  'INTERNAL_ADMIN',
  'MANAGER',
  'SALES',
  'TECHNICAL',
  'CLIENT_ADMIN',
  'CLIENT_MEMBER',
  'CLIENT_VIEWER'
);

CREATE TYPE "MembershipStatus" AS ENUM (
  'ACTIVE',
  'INVITED',
  'SUSPENDED'
);

ALTER TABLE "User"
  ADD COLUMN "clerkUserId" TEXT;

CREATE UNIQUE INDEX "User_clerkUserId_key"
  ON "User"("clerkUserId");

CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "OrganizationType" NOT NULL,
  "companyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_companyId_key"
  ON "Organization"("companyId");

CREATE INDEX "Organization_type_idx"
  ON "Organization"("type");

ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Membership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "role" "MembershipRole" NOT NULL,
  "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Membership_userId_organizationId_key"
  ON "Membership"("userId", "organizationId");

CREATE INDEX "Membership_organizationId_idx"
  ON "Membership"("organizationId");

CREATE INDEX "Membership_userId_idx"
  ON "Membership"("userId");

ALTER TABLE "Membership"
  ADD CONSTRAINT "Membership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Membership"
  ADD CONSTRAINT "Membership_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Stable internal organization.
INSERT INTO "Organization" ("id", "name", "type", "updatedAt")
VALUES ('org_internal_ichikawa', 'Ichikawa Solutions Ltd.', 'INTERNAL', CURRENT_TIMESTAMP);

-- Every existing CRM Company becomes a client organization.
INSERT INTO "Organization" ("id", "name", "type", "companyId", "updatedAt")
SELECT
  'org_client_' || "id",
  "name",
  'CLIENT'::"OrganizationType",
  "id",
  CURRENT_TIMESTAMP
FROM "Company";

-- Backfill existing users.
--
-- Existing MANAGER/SALES/TECHNICAL users become members of Ichikawa.
-- Existing CLIENT users are attached to their existing company organization.
INSERT INTO "Membership"
  ("id", "userId", "organizationId", "role", "status", "updatedAt")
SELECT
  'membership_' || u."id" || '_internal',
  u."id",
  'org_internal_ichikawa',
  CASE
    WHEN u."companyAdmin" = TRUE THEN 'INTERNAL_ADMIN'::"MembershipRole"
    WHEN u."role" = 'MANAGER' THEN 'MANAGER'::"MembershipRole"
    WHEN u."role" = 'TECHNICAL' THEN 'TECHNICAL'::"MembershipRole"
    ELSE 'SALES'::"MembershipRole"
  END,
  'ACTIVE'::"MembershipStatus",
  CURRENT_TIMESTAMP
FROM "User" u
WHERE u."role" <> 'CLIENT';

INSERT INTO "Membership"
  ("id", "userId", "organizationId", "role", "status", "updatedAt")
SELECT
  'membership_' || u."id" || '_client',
  u."id",
  'org_client_' || u."companyId",
  CASE
    WHEN u."companyAdmin" = TRUE THEN 'CLIENT_ADMIN'::"MembershipRole"
    ELSE 'CLIENT_MEMBER'::"MembershipRole"
  END,
  'ACTIVE'::"MembershipStatus",
  CURRENT_TIMESTAMP
FROM "User" u
WHERE u."role" = 'CLIENT'
  AND u."companyId" IS NOT NULL;

COMMIT;
