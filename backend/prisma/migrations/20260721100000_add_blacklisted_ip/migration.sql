CREATE TABLE "BlacklistedIp" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlacklistedIp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlacklistedIp_ipAddress_key" ON "BlacklistedIp"("ipAddress");
CREATE INDEX "BlacklistedIp_ipAddress_idx" ON "BlacklistedIp"("ipAddress");
CREATE INDEX "BlacklistedIp_source_idx" ON "BlacklistedIp"("source");
