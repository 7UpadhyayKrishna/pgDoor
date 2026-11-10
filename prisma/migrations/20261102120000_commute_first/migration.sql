-- CreateEnum
DO $$ BEGIN CREATE TYPE "DestinationType" AS ENUM ('COLLEGE', 'OFFICE', 'COACHING', 'LIBRARY', 'METRO', 'CUSTOM'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "CommuteMode" AS ENUM ('walk', 'cycle', 'metro', 'rapid_metro', 'bus', 'auto', 'shared_auto', 'rapido', 'cab', 'own_vehicle'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "CommuteSlot" AS ENUM ('peak', 'offpeak'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "CommuteSource" AS ENUM ('google', 'fare_table', 'estimate'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "PoiCategory" AS ENUM ('FOOD', 'GROCERY', 'METRO', 'BUS_STOP', 'HOSPITAL', 'PHARMACY', 'GYM', 'LAUNDRY', 'CAFE', 'ATM', 'PARK', 'LIBRARY', 'POLICE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'PUSH', 'WHATSAPP'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterTable Property
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "h3Cell" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "livabilityScore" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "livabilityBreakdown" JSONB;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "safetyScore" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "safetyBreakdown" JSONB;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "commuteBadges" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "tourVideoUrl" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "tourThumbnailUrl" TEXT;

CREATE INDEX IF NOT EXISTS "Property_h3Cell_idx" ON "Property"("h3Cell");
CREATE INDEX IF NOT EXISTS "Property_latitude_longitude_idx" ON "Property"("latitude", "longitude");

-- AlterTable Review
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "verifiedStay" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ReviewScore" ADD COLUMN IF NOT EXISTS "commute" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ReviewScore" ADD COLUMN IF NOT EXISTS "safety" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ReviewScore" ADD COLUMN IF NOT EXISTS "owner" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "Destination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "DestinationType" NOT NULL,
    "cityId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "h3Cell" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "metroLine" TEXT,
    "seoEnabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Destination_slug_key" ON "Destination"("slug");
CREATE INDEX IF NOT EXISTS "Destination_popularity_idx" ON "Destination"("popularity");
CREATE INDEX IF NOT EXISTS "Destination_h3Cell_idx" ON "Destination"("h3Cell");
CREATE INDEX IF NOT EXISTS "Destination_type_idx" ON "Destination"("type");
CREATE INDEX IF NOT EXISTS "Destination_seoEnabled_idx" ON "Destination"("seoEnabled");

ALTER TABLE "Destination" DROP CONSTRAINT IF EXISTS "Destination_cityId_fkey";
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "CommuteEdge" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "destH3" TEXT NOT NULL,
    "mode" "CommuteMode" NOT NULL,
    "slot" "CommuteSlot" NOT NULL,
    "minutes" INTEGER NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "oneWayCost" INTEGER NOT NULL,
    "legs" JSONB,
    "source" "CommuteSource" NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approximate" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CommuteEdge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommuteEdge_propertyId_destH3_mode_slot_key" ON "CommuteEdge"("propertyId", "destH3", "mode", "slot");
CREATE INDEX IF NOT EXISTS "CommuteEdge_destH3_mode_slot_idx" ON "CommuteEdge"("destH3", "mode", "slot");
CREATE INDEX IF NOT EXISTS "CommuteEdge_computedAt_idx" ON "CommuteEdge"("computedAt");

ALTER TABLE "CommuteEdge" DROP CONSTRAINT IF EXISTS "CommuteEdge_propertyId_fkey";
ALTER TABLE "CommuteEdge" ADD CONSTRAINT "CommuteEdge_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "FareRule" (
    "id" TEXT NOT NULL,
    "mode" "CommuteMode" NOT NULL,
    "city" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "slabs" JSONB,
    "base" DOUBLE PRECISION,
    "perKm" DOUBLE PRECISION,
    "perMin" DOUBLE PRECISION,
    "peakMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sourceUrl" TEXT NOT NULL,
    "estimate" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FareRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FareRule_mode_city_effectiveFrom_idx" ON "FareRule"("mode", "city", "effectiveFrom");

CREATE TABLE IF NOT EXISTS "Poi" (
    "id" TEXT NOT NULL,
    "osmOrPlaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PoiCategory" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION,
    "openLate" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'places',
    CONSTRAINT "Poi_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Poi_osmOrPlaceId_key" ON "Poi"("osmOrPlaceId");
CREATE INDEX IF NOT EXISTS "Poi_category_idx" ON "Poi"("category");

CREATE TABLE IF NOT EXISTS "PropertyPoi" (
    "propertyId" TEXT NOT NULL,
    "poiId" TEXT NOT NULL,
    "walkingMinutes" INTEGER NOT NULL,
    CONSTRAINT "PropertyPoi_pkey" PRIMARY KEY ("propertyId","poiId")
);

ALTER TABLE "PropertyPoi" DROP CONSTRAINT IF EXISTS "PropertyPoi_propertyId_fkey";
ALTER TABLE "PropertyPoi" ADD CONSTRAINT "PropertyPoi_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyPoi" DROP CONSTRAINT IF EXISTS "PropertyPoi_poiId_fkey";
ALTER TABLE "PropertyPoi" ADD CONSTRAINT "PropertyPoi_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "Poi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "UserSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT,
    "destinations" JSONB NOT NULL,
    "prefs" JSONB NOT NULL,
    "arrivalTime" TEXT NOT NULL DEFAULT '09:30',
    "maxMin" INTEGER,
    "maxCost" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSearch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserSearch_userId_idx" ON "UserSearch"("userId");
ALTER TABLE "UserSearch" DROP CONSTRAINT IF EXISTS "UserSearch_userId_fkey";
ALTER TABLE "UserSearch" ADD CONSTRAINT "UserSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userSearchId" TEXT,
    "propertyId" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Alert_userId_readAt_idx" ON "Alert"("userId", "readAt");
ALTER TABLE "Alert" DROP CONSTRAINT IF EXISTS "Alert_userId_fkey";
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Alert" DROP CONSTRAINT IF EXISTS "Alert_userSearchId_fkey";
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userSearchId_fkey" FOREIGN KEY ("userSearchId") REFERENCES "UserSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "RoommateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "destH3" TEXT,
    "destLabel" TEXT,
    "bio" TEXT,
    "habits" JSONB NOT NULL,
    "optIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoommateProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RoommateProfile_userId_key" ON "RoommateProfile"("userId");
ALTER TABLE "RoommateProfile" DROP CONSTRAINT IF EXISTS "RoommateProfile_userId_fkey";
ALTER TABLE "RoommateProfile" ADD CONSTRAINT "RoommateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "RoommateMatch" (
    "id" TEXT NOT NULL,
    "aUserId" TEXT NOT NULL,
    "bUserId" TEXT NOT NULL,
    "aAccepted" BOOLEAN NOT NULL DEFAULT false,
    "bAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoommateMatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RoommateMatch_aUserId_bUserId_key" ON "RoommateMatch"("aUserId", "bUserId");
ALTER TABLE "RoommateMatch" DROP CONSTRAINT IF EXISTS "RoommateMatch_aUserId_fkey";
ALTER TABLE "RoommateMatch" ADD CONSTRAINT "RoommateMatch_aUserId_fkey" FOREIGN KEY ("aUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoommateMatch" DROP CONSTRAINT IF EXISTS "RoommateMatch_bUserId_fkey";
ALTER TABLE "RoommateMatch" ADD CONSTRAINT "RoommateMatch_bUserId_fkey" FOREIGN KEY ("bUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
