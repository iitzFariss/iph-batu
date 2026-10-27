ALTER TABLE "iph_batu"."Rapat" ADD COLUMN "tautanRapat" TEXT;
ALTER TABLE "iph_batu"."Rapat" ADD COLUMN "notulensiKey" TEXT;
ALTER TABLE "iph_batu"."Rapat" ADD COLUMN "notulensiInvitedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Rapat_notulensiKey_key" ON "iph_batu"."Rapat"("notulensiKey");
UPDATE "iph_batu"."Rapat" SET "notulensiKey" = gen_random_uuid()::TEXT WHERE "notulensiKey" IS NULL;
CREATE TABLE "iph_batu"."AppSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
