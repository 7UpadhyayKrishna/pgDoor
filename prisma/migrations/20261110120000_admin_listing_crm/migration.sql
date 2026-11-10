-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ProspectSource" AS ENUM ('FIELD_VISIT', 'REFERRAL', 'INBOUND', 'CALL', 'OTHER');

-- CreateEnum
CREATE TYPE "ProspectStage" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'VISIT_SCHEDULED', 'LISTED', 'ONBOARDED', 'LOST');

-- CreateEnum
CREATE TYPE "ProspectActivityType" AS ENUM ('NOTE', 'CALL', 'WHATSAPP', 'VISIT', 'STAGE_CHANGE', 'FOLLOW_UP');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "OwnerProfile" ADD COLUMN     "createdByAdminId" TEXT,
ADD COLUMN     "credentialIssuedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "VerificationCheck" ADD COLUMN     "checkedById" TEXT,
ADD COLUMN     "evidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "CheckStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "OwnerProspect" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "businessName" TEXT,
    "pgName" TEXT,
    "cityId" TEXT,
    "areaId" TEXT,
    "address" TEXT,
    "approxBeds" INTEGER,
    "source" "ProspectSource" NOT NULL DEFAULT 'OTHER',
    "stage" "ProspectStage" NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "nextFollowUpAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "ownerProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerProspect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectActivity" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "ProspectActivityType" NOT NULL,
    "body" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OwnerProspect_stage_nextFollowUpAt_idx" ON "OwnerProspect"("stage", "nextFollowUpAt");

-- CreateIndex
CREATE INDEX "OwnerProspect_phone_idx" ON "OwnerProspect"("phone");

-- CreateIndex
CREATE INDEX "OwnerProspect_assignedToId_idx" ON "OwnerProspect"("assignedToId");

-- CreateIndex
CREATE INDEX "ProspectActivity_prospectId_createdAt_idx" ON "ProspectActivity"("prospectId", "createdAt");

-- AddForeignKey
ALTER TABLE "VerificationCheck" ADD CONSTRAINT "VerificationCheck_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerProspect" ADD CONSTRAINT "OwnerProspect_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerProspect" ADD CONSTRAINT "OwnerProspect_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerProspect" ADD CONSTRAINT "OwnerProspect_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerProspect" ADD CONSTRAINT "OwnerProspect_ownerProfileId_fkey" FOREIGN KEY ("ownerProfileId") REFERENCES "OwnerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectActivity" ADD CONSTRAINT "ProspectActivity_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "OwnerProspect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectActivity" ADD CONSTRAINT "ProspectActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill check status from the legacy boolean
UPDATE "VerificationCheck" SET "status" = 'PASSED' WHERE "passed" = true;
