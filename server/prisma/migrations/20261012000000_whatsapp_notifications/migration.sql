BEGIN;
-- AlterTable
ALTER TABLE "iph_batu"."Pegawai" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "iph_batu"."Rapat" ADD COLUMN     "notificationRevision" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "iph_batu"."WhatsAppNotification" (
    "id" TEXT NOT NULL,
    "rapatId" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppNotification_status_scheduledAt_idx" ON "iph_batu"."WhatsAppNotification"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppNotification_rapatId_pegawaiId_kind_revision_key" ON "iph_batu"."WhatsAppNotification"("rapatId", "pegawaiId", "kind", "revision");

-- AddForeignKey
ALTER TABLE "iph_batu"."WhatsAppNotification" ADD CONSTRAINT "WhatsAppNotification_rapatId_fkey" FOREIGN KEY ("rapatId") REFERENCES "iph_batu"."Rapat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
