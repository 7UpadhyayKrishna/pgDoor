-- Unknown deposits are NULL ("Ask owner"), not 0.
ALTER TABLE "Property" ALTER COLUMN "minDeposit" DROP NOT NULL,
ALTER COLUMN "minDeposit" DROP DEFAULT;

ALTER TABLE "RoomType" ALTER COLUMN "deposit" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AvailabilityWatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityWatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertySlugRedirect" (
    "slug" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertySlugRedirect_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityWatch_userId_propertyId_key" ON "AvailabilityWatch"("userId", "propertyId");

-- CreateIndex
CREATE INDEX "AvailabilityWatch_propertyId_notifiedAt_idx" ON "AvailabilityWatch"("propertyId", "notifiedAt");

-- CreateIndex
CREATE INDEX "PropertySlugRedirect_propertyId_idx" ON "PropertySlugRedirect"("propertyId");

-- AddForeignKey
ALTER TABLE "AvailabilityWatch" ADD CONSTRAINT "AvailabilityWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityWatch" ADD CONSTRAINT "AvailabilityWatch_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertySlugRedirect" ADD CONSTRAINT "PropertySlugRedirect_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
